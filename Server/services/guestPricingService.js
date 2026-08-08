import mongoose from 'mongoose';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Review from '../models/Review.js';
import Offer from '../models/Offer.js';
import { BOOKING_STATUS } from '../constants/bookingStatuses.js';
import bookingConfig from '../configs/bookingConfig.js';
import logger from '../utils/logger.js';

const getSeasonMultiplier = (date, hotelRules) => {
  const month = date.getMonth();
  const overrides = hotelRules?.seasonalOverrides || [];
  const rules = overrides.length > 0 ? overrides : bookingConfig.seasonalRules;
  for (const rule of rules) {
    const [startM, startD] = rule.start.split('-').map(Number);
    const [endM, endD] = rule.end.split('-').map(Number);
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    let inSeason;
    if (startM <= endM) {
      inSeason = (m > startM || (m === startM && d >= startD)) && (m < endM || (m === endM && d <= endD));
    } else {
      inSeason = (m > startM || (m === startM && d >= startD)) || (m < endM || (m === endM && d <= endD));
    }
    if (inSeason) return rule.multiplier;
  }
  return 1;
};

const getAvailableRoomsWithDetails = async ({ city, roomType, hotelId, limit }) => {
  const filter = { isAvailable: true };
  if (city) filter.hotelCity = { $regex: city.trim(), $options: 'i' };
  if (roomType) filter.roomType = roomType;
  if (hotelId) filter.hotel = hotelId;

  const rooms = await Room.find(filter)
    .populate('hotel', 'name city address pricingRules currency')
    .limit(limit || 100)
    .lean();

  const roomIds = rooms.map((r) => r._id);
  const ratingAgg = await Review.aggregate([
    { $match: { room: { $in: roomIds } } },
    { $group: { _id: '$room', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const ratingMap = {};
  ratingAgg.forEach((r) => { ratingMap[r._id.toString()] = r; });

  const now = new Date();
  const activeOffers = await Offer.find({
    room: { $in: roomIds },
    isActive: true,
    expiryDate: { $gte: now },
  }).lean();
  const offerMap = {};
  activeOffers.forEach((o) => {
    const rid = o.room?.toString();
    if (!offerMap[rid]) offerMap[rid] = [];
    offerMap[rid].push(o);
  });

  const lastMinuteWindow = bookingConfig.lastMinuteWindowHours || 48;

  return rooms.map((room) => {
    const rid = room._id.toString();
    const ratingInfo = ratingMap[rid];
    const avgRating = ratingInfo?.avgRating || 0;
    const reviewCount = ratingInfo?.count || 0;
    const roomOffers = offerMap[rid] || [];
    const bestOffer = roomOffers.sort((a, b) => b.discountPercent - a.discountPercent)[0];

    const hotelRules = room.hotel?.pricingRules || {};
    const weekendCharge = hotelRules.weekendSurcharge ?? bookingConfig.weekendSurcharge;
    const occSurcharge = hotelRules.highOccupancySurcharge ?? bookingConfig.highOccupancySurcharge;
    const occThreshold = hotelRules.highOccupancyThreshold ?? bookingConfig.highOccupancyThreshold;
    const lastMinuteDisc = hotelRules.lastMinuteDiscount ?? bookingConfig.lastMinuteDiscount;
    const earlyBirdDisc = hotelRules.earlyBirdDiscount ?? bookingConfig.earlyBirdDiscount;
    const earlyBirdWindow = hotelRules.earlyBirdWindowDays ?? bookingConfig.earlyBirdWindowDays;

    return {
      ...room,
      avgRating,
      reviewCount,
      bestOffer: bestOffer || null,
      pricingFactors: {
        weekendCharge,
        occSurcharge,
        occThreshold,
        lastMinuteDisc,
        earlyBirdDisc,
        earlyBirdWindow,
      },
    };
  });
};

export const getBestValueRooms = async ({ city, budget = 500, roomType, hotelId, limit = 20 }) => {
  const rooms = await getAvailableRoomsWithDetails({ city, roomType, hotelId, limit: limit * 2 });

  const maxAmenities = Math.max(...rooms.map((r) => r.amenities?.length || 0), 1);
  const scored = rooms.map((room) => {
    const price = Number(room.pricePerNight) || 0;
    const budgetFit = budget > 0 ? Math.max(0, 1 - Math.abs(price - budget) / budget) : 0.5;

    const ratingScore = (room.avgRating / 5) * 30;
    const budgetScore = budgetFit * 25;
    const amenityScore = ((room.amenities?.length || 0) / maxAmenities) * 15;
    const offerScore = room.bestOffer ? 15 : 0;
    const lastMinuteScore = 0;
    const topRatedScore = room.avgRating >= 4.5 ? 5 : 0;

    const valueScore = Math.round(ratingScore + budgetScore + amenityScore + offerScore + lastMinuteScore + topRatedScore);

    const reasons = [];
    if (room.avgRating >= 4) reasons.push(`Highly rated (${room.avgRating.toFixed(1)} stars)`);
    if (room.bestOffer) reasons.push(`${room.bestOffer.discountPercent}% OFF offer available`);
    if (budgetFit > 0.8) reasons.push('Fits your budget perfectly');
    if ((room.amenities?.length || 0) >= 6) reasons.push('Excellent amenities');
    if (room.avgRating >= 4.5) reasons.push('Top-rated by guests');
    reasons.push('Great value for price');

    const savingsPercent = room.bestOffer ? room.bestOffer.discountPercent : 0;

    return {
      _id: room._id,
      hotel: room.hotel,
      hotelCity: room.hotelCity,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      pricePerNight: price,
      amenities: room.amenities,
      images: room.images,
      capacity: room.capacity,
      createdAt: room.createdAt,
      avgRating: Number(room.avgRating.toFixed(1)),
      reviewCount: room.reviewCount,
      valueScore,
      savingsPercent,
      bestOffer: room.bestOffer,
      recommendationReasons: reasons,
    };
  });

  scored.sort((a, b) => b.valueScore - a.valueScore);
  return scored.slice(0, limit);
};

export const getCheapestDates = async ({ roomId, hotelId, monthsAhead = 2 }) => {
  if (!roomId && !hotelId) throw new Error('roomId or hotelId required');

  let room;
  if (roomId) {
    if (!mongoose.Types.ObjectId.isValid(roomId)) throw new Error('Invalid room ID');
    room = await Room.findById(roomId).populate('hotel').lean();
  } else {
    const rooms = await Room.find({ hotel: hotelId, isAvailable: true }).populate('hotel').limit(1).lean();
    room = rooms[0];
  }
  if (!room) throw new Error('Room not found');

  const basePrice = Number(room.pricePerNight) || 0;
  const hotelRules = room.hotel?.pricingRules || {};
  const weekendCharge = hotelRules.weekendSurcharge ?? bookingConfig.weekendSurcharge;
  const occSurcharge = hotelRules.highOccupancySurcharge ?? bookingConfig.highOccupancySurcharge;
  const occThreshold = hotelRules.highOccupancyThreshold ?? bookingConfig.highOccupancyThreshold;
  const lastMinuteDisc = hotelRules.lastMinuteDiscount ?? bookingConfig.lastMinuteDiscount;
  const earlyBirdDisc = hotelRules.earlyBirdDiscount ?? bookingConfig.earlyBirdDiscount;
  const earlyBirdWindow = hotelRules.earlyBirdWindowDays ?? bookingConfig.earlyBirdWindowDays;

  const hotelIdStr = String(room.hotel?._id || room.hotel);
  const totalRooms = await Room.countDocuments({ hotel: hotelIdStr });

  const now = new Date();
  const endDate = new Date(now.getTime() + monthsAhead * 30 * 24 * 60 * 60 * 1000);
  const dates = [];

  const currentDate = new Date(now);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate < endDate) {
    const dayOfWeek = currentDate.getDay();
    let multiplier = 1;
    const appliedRules = [];

    if (dayOfWeek === 5 || dayOfWeek === 6) {
      multiplier += weekendCharge;
      appliedRules.push({ rule: 'weekend', label: 'Weekend Premium', delta: weekendCharge });
    }

    const seasonalMult = getSeasonMultiplier(currentDate, hotelRules);
    if (seasonalMult !== 1) {
      multiplier *= seasonalMult;
      appliedRules.push({ rule: 'seasonal', label: 'Seasonal Rate', delta: seasonalMult, isMultiplicative: true });
    }

    const activeBookings = await Booking.countDocuments({
      hotel: hotelIdStr,
      checkInDate: { $lte: currentDate },
      checkOutDate: { $gte: currentDate },
      status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] },
    });
    if (totalRooms > 0 && activeBookings / totalRooms > occThreshold) {
      multiplier += occSurcharge;
      appliedRules.push({ rule: 'occupancy', label: 'High Demand', delta: occSurcharge });
    }

    const hoursTillCheckin = (currentDate.getTime() - now.getTime()) / (1000 * 3600);
    if (hoursTillCheckin > 0 && hoursTillCheckin <= bookingConfig.lastMinuteWindowHours) {
      multiplier -= lastMinuteDisc;
      appliedRules.push({ rule: 'lastMinute', label: 'Last-Minute Savings', delta: -lastMinuteDisc });
    }

    const daysTillCheckin = (currentDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
    if (daysTillCheckin >= earlyBirdWindow) {
      multiplier -= earlyBirdDisc;
      appliedRules.push({ rule: 'earlyBird', label: 'Early Bird Savings', delta: -earlyBirdDisc });
    }

    const finalMultiplier = Math.max(0.5, Number(multiplier.toFixed(2)));
    const effectivePrice = Number((basePrice * finalMultiplier).toFixed(2));
    const savingsPercent = basePrice > 0 ? Math.round(((basePrice - effectivePrice) / basePrice) * 100) : 0;

    dates.push({
      date: currentDate.toISOString().split('T')[0],
      effectivePrice,
      multiplier: finalMultiplier,
      basePrice,
      savingsPercent: savingsPercent > 0 ? savingsPercent : 0,
      appliedRules,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const cheapest = [...dates].sort((a, b) => a.effectivePrice - b.effectivePrice).slice(0, 10);

  return {
    roomId: room._id,
    roomType: room.roomType,
    hotelName: room.hotel?.name || '',
    basePrice,
    currency: room.hotel?.currency || 'USD',
    totalDates: dates.length,
    cheapestDates: cheapest,
    priceRange: {
      min: Math.min(...dates.map((d) => d.effectivePrice)),
      max: Math.max(...dates.map((d) => d.effectivePrice)),
    },
    calendar: dates,
  };
};

export const getPriceForecast = async ({ roomId }) => {
  if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
    throw new Error('Invalid room ID');
  }

  const room = await Room.findById(roomId).populate('hotel').lean();
  if (!room) throw new Error('Room not found');

  const basePrice = Number(room.pricePerNight) || 0;
  const hotelId = String(room.hotel?._id || '');
  const hotelRules = room.hotel?.pricingRules || {};

  const now = new Date();
  const month = now.getMonth();
  const isPeakSeason = month >= 5 && month <= 8;
  const isHolidaySeason = month === 11 || month === 0 || month === 1;

  const totalRooms = await Room.countDocuments({ hotel: hotelId, isAvailable: true });
  const activeBookings = await Booking.countDocuments({
    hotel: hotelId,
    checkInDate: { $lte: now },
    checkOutDate: { $gte: now },
    status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] },
  });
  const occupancyRate = totalRooms > 0 ? activeBookings / totalRooms : 0;

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthBookings = await Booking.countDocuments({
    hotel: hotelId,
    checkInDate: { $gte: now, $lt: nextMonth },
    status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] },
  });

  const upcomingDemand = totalRooms > 0 ? nextMonthBookings / totalRooms : 0;

  let predictedDirection = 'stable';
  if ((isPeakSeason || isHolidaySeason) && occupancyRate > 0.6) {
    predictedDirection = 'up';
  } else if (occupancyRate < 0.3 && !isPeakSeason) {
    predictedDirection = 'down';
  } else if (upcomingDemand > 0.5) {
    predictedDirection = 'up';
  }

  let bestTimeToBook = 'Now';
  let confidence = 0.5;
  if (predictedDirection === 'up') {
    bestTimeToBook = 'Book now — prices expected to rise';
    confidence = occupancyRate > 0.7 ? 0.85 : 0.65;
  } else if (predictedDirection === 'down') {
    bestTimeToBook = 'Wait 1-2 weeks — prices may drop';
    confidence = occupancyRate < 0.2 ? 0.75 : 0.55;
  } else {
    bestTimeToBook = 'Current prices are stable — good time to book';
    confidence = 0.7;
  }

  const currentMult = getSeasonMultiplier(now, hotelRules);
  const estimatedPrice = Number((basePrice * currentMult).toFixed(2));

  const nextMonthMult = getSeasonMultiplier(new Date(now.getFullYear(), now.getMonth() + 1, 15), hotelRules);
  const forecastPrice = Number((basePrice * nextMonthMult).toFixed(2));

  return {
    roomId: room._id,
    currentPrice: estimatedPrice,
    basePrice,
    forecastPrice,
    predictedDirection,
    bestTimeToBook,
    confidence,
    factors: {
      isPeakSeason,
      isHolidaySeason,
      occupancyRate: Number(occupancyRate.toFixed(2)),
      upcomingDemand: Number(upcomingDemand.toFixed(2)),
      seasonMultiplier: currentMult,
    },
  };
};

export default { getBestValueRooms, getCheapestDates, getPriceForecast };
