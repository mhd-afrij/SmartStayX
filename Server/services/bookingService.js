import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import Offer from '../models/Offer.js';
import { BOOKING_STATUS } from '../constants/bookingStatuses.js';
import bookingConfig from '../configs/bookingConfig.js';
import { acquireLock, releaseLock, extendLock } from '../utils/redisClient.js';

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

const normalizeBookingWindow = (checkInDate, checkOutDate) => {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return null;
  if (checkOut <= checkIn) return null;

  const nights = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
  return { checkIn, checkOut, nights };
};

const checkAvailability = async ({ room, checkInDate, checkOutDate, excludeBookingId }) => {
  const window = normalizeBookingWindow(checkInDate, checkOutDate);
  if (!window) return false;
  if (typeof room !== 'string') return false;

  const query = {
    room,
    checkInDate: { $lt: window.checkOut },
    checkOutDate: { $gt: window.checkIn },
    status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const count = await Booking.countDocuments(query);
  return count === 0;
};

const getHotelPricingRules = async (hotelId) => {
  try {
    const hotel = await Hotel.findById(hotelId).select('pricingRules currency').lean();
    return hotel?.pricingRules || {};
  } catch {
    return {};
  }
};

const isInSeason = (date, rule) => {
  const [startM, startD] = rule.start.split('-').map(Number);
  const [endM, endD] = rule.end.split('-').map(Number);
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  if (startM <= endM) {
    return (m > startM || (m === startM && d >= startD)) &&
           (m < endM || (m === endM && d <= endD));
  }
  return (m > startM || (m === startM && d >= startD)) ||
         (m < endM || (m === endM && d <= endD));
};

const getSeasonalMultiplier = (checkIn, hotelRules) => {
  const overrides = hotelRules.seasonalOverrides || [];
  const rules = overrides.length > 0 ? overrides : bookingConfig.seasonalRules;
  for (const rule of rules) {
    if (isInSeason(checkIn, rule)) return rule.multiplier;
  }
  return 1;
};

const getLosDiscount = (nights, hotelRules) => {
  const discounts = hotelRules.lengthOfStayDiscounts || bookingConfig.lengthOfStayDiscounts;
  let best = 0;
  for (const d of discounts) {
    if (nights >= d.minNights && d.discount > best) best = d.discount;
  }
  return best;
};

const getLastMinuteDiscount = (checkIn, hotelRules) => {
  const now = Date.now();
  const hoursTillCheckin = (checkIn.getTime() - now) / (1000 * 3600);
  const window = bookingConfig.lastMinuteWindowHours;
  if (hoursTillCheckin > 0 && hoursTillCheckin <= window) {
    return hotelRules.lastMinuteDiscount ?? bookingConfig.lastMinuteDiscount;
  }
  return 0;
};

const getEarlyBirdDiscount = (checkIn, hotelRules) => {
  const now = Date.now();
  const daysTillCheckin = (checkIn.getTime() - now) / (1000 * 3600 * 24);
  const window = hotelRules.earlyBirdWindowDays ?? bookingConfig.earlyBirdWindowDays;
  if (daysTillCheckin >= window) {
    return hotelRules.earlyBirdDiscount ?? bookingConfig.earlyBirdDiscount;
  }
  return 0;
};

const getRepeatGuestDiscount = async (userId, hotelRules) => {
  if (!userId) return 0;
  try {
    const pastCount = await Booking.countDocuments({
      user: userId,
      status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.CHECKED_OUT] },
    });
    if (pastCount > 0) {
      return hotelRules.repeatGuestDiscount ?? bookingConfig.repeatGuestDiscount;
    }
  } catch {
    // Silently fail — discount is a bonus, not a blocker
  }
  return 0;
};

// -----------------------------------------------------------------------
// Pricing calculation (all rules applied)
// -----------------------------------------------------------------------

const calculateBookingPricing = async ({ roomData, checkInDate, checkOutDate, guests, offerId, userId }) => {
  const window = normalizeBookingWindow(checkInDate, checkOutDate);
  if (!window) throw Object.assign(new Error('Invalid booking dates'), { status: 400 });

  const { checkIn, nights } = window;
  const basePrice = Number(roomData.pricePerNight) || 0;
  let multiplier = 1;
  let adjustments = [];

  const hotelId = roomData.hotel?._id || roomData.hotel;
  const hotelRules = await getHotelPricingRules(hotelId);

  // 1) Weekend surcharge
  const weekendCharge = hotelRules.weekendSurcharge ?? bookingConfig.weekendSurcharge;
  const dayOfWeek = checkIn.getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    multiplier += weekendCharge;
    adjustments.push({ type: 'weekendSurcharge', label: 'Weekend Premium', value: weekendCharge });
  }

  // 2) High-occupancy surcharge
  const [totalRooms, activeBookings] = await Promise.all([
    Room.countDocuments({ hotel: hotelId }),
    Booking.countDocuments({
      hotel: hotelId,
      checkInDate: { $lte: checkIn },
      checkOutDate: { $gte: checkIn },
      status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] },
    }),
  ]);

  const occThreshold = hotelRules.highOccupancyThreshold ?? bookingConfig.highOccupancyThreshold;
  const occSurcharge = hotelRules.highOccupancySurcharge ?? bookingConfig.highOccupancySurcharge;
  if (totalRooms > 0 && activeBookings / totalRooms > occThreshold) {
    multiplier += occSurcharge;
    adjustments.push({ type: 'highOccupancy', label: 'High Demand', value: occSurcharge });
  }

  // 3) Seasonal multiplier
  const seasonalMult = getSeasonalMultiplier(checkIn, hotelRules);
  if (seasonalMult !== 1) {
    multiplier *= seasonalMult;
    adjustments.push({ type: 'seasonal', label: 'Seasonal Rate', value: seasonalMult, isMultiplicative: true });
  }

  // 4) Last-minute discount
  const lastMinuteDisc = getLastMinuteDiscount(checkIn, hotelRules);
  if (lastMinuteDisc > 0) {
    multiplier -= lastMinuteDisc;
    adjustments.push({ type: 'lastMinute', label: 'Last-Minute Savings', value: -lastMinuteDisc });
  }

  // 5) Length-of-stay discount
  const losDisc = getLosDiscount(nights, hotelRules);
  if (losDisc > 0) {
    multiplier -= losDisc;
    adjustments.push({ type: 'lengthOfStay', label: `Longer Stay Savings (${nights} nights)`, value: -losDisc });
  }

  // 6) Early-bird discount
  const earlyBirdDisc = getEarlyBirdDiscount(checkIn, hotelRules);
  if (earlyBirdDisc > 0) {
    multiplier -= earlyBirdDisc;
    adjustments.push({ type: 'earlyBird', label: 'Early Bird Savings', value: -earlyBirdDisc });
  }

  // 7) Repeat guest discount
  const repeatDisc = await getRepeatGuestDiscount(userId, hotelRules);
  if (repeatDisc > 0) {
    multiplier -= repeatDisc;
    adjustments.push({ type: 'repeatGuest', label: 'Returning Guest Reward', value: -repeatDisc });
  }

  const finalMultiplier = Math.max(0.5, Number(multiplier.toFixed(2)));
  let dynamicPrice = Number((basePrice * finalMultiplier).toFixed(2));

  // 8) Offer discount
  let offerDiscountPercent = 0;
  if (offerId) {
    const offer = await Offer.findOne({
      _id: offerId,
      room: roomData._id,
      hotel: hotelId,
      isActive: true,
      expiryDate: { $gte: new Date() },
    });
    if (offer) {
      offerDiscountPercent = offer.discountPercent;
      dynamicPrice = Number((dynamicPrice * (1 - offerDiscountPercent / 100)).toFixed(2));
      adjustments.push({ type: 'offer', label: `Offer (${offerDiscountPercent}% off)`, value: -(offerDiscountPercent / 100) });
    }
  }

  const totalPrice = Number((dynamicPrice * nights).toFixed(2));
  const baseTotal = Number((basePrice * nights).toFixed(2));
  const totalSavings = Number(((baseTotal - totalPrice) / baseTotal * 100).toFixed(1));

  return {
    guests: Math.max(1, Number(guests) || 1),
    nights,
    basePricePerNight: basePrice,
    dynamicPricePerNight: dynamicPrice,
    priceMultiplier: finalMultiplier,
    totalPrice,
    baseTotal,
    totalSavingsPercent: totalSavings,
    adjustments,
    offerDiscountPercent,
    originalPricePerNight: offerDiscountPercent > 0
      ? Number((basePrice * finalMultiplier).toFixed(2))
      : undefined,
  };
};

// -----------------------------------------------------------------------
// Booking creation with distributed lock
// -----------------------------------------------------------------------

const createBooking = async ({ userId, room, checkInDate, checkOutDate, guests, holdMinutes, offerId }) => {
  if (typeof room !== 'string' || !mongoose.Types.ObjectId.isValid(room)) {
    throw Object.assign(new Error('Invalid room id'), { status: 400 });
  }
  const roomId = new mongoose.Types.ObjectId(room).toString();

  const window = normalizeBookingWindow(checkInDate, checkOutDate);
  if (!window) throw Object.assign(new Error('Invalid booking dates'), { status: 400 });

  // Attempt distributed lock (falls back gracefully if Redis is unavailable)
  const lock = await acquireLock(roomId, window.checkIn, window.checkOut);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const overlapping = await Booking.findOne({
      room: roomId,
      checkInDate: { $lt: new Date(checkOutDate) },
      checkOutDate: { $gt: new Date(checkInDate) },
      status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] },
    }).session(session);

    if (overlapping) throw Object.assign(new Error('Room not available'), { status: 409 });

    const roomData = await Room.findById(roomId).populate('hotel').session(session);
    if (!roomData) throw Object.assign(new Error('Room not found'), { status: 404 });

    const pricing = await calculateBookingPricing({ roomData, checkInDate, checkOutDate, guests, offerId, userId });

    const hotelRules = await getHotelPricingRules(roomData.hotel?._id);
    const effectiveHoldMinutes = holdMinutes || hotelRules.holdMinutes || bookingConfig.holdMinutes;

    const now = new Date();
    const holdMs = effectiveHoldMinutes * 60 * 1000;
    const holdExpiresAt = new Date(now.getTime() + holdMs);
    const idempotencyKey = new mongoose.Types.ObjectId().toString();

    const [booking] = await Booking.create([{
      user: userId,
      room: roomId,
      hotel: roomData.hotel._id,
      guests: pricing.guests,
      checkInDate,
      checkOutDate,
      nights: pricing.nights,
      basePricePerNight: pricing.basePricePerNight,
      dynamicPricePerNight: pricing.dynamicPricePerNight,
      priceMultiplier: pricing.priceMultiplier,
      guestDisplayName: 'Guest',
      guestEmail: '',
      totalPrice: pricing.totalPrice,
      holdExpiresAt,
      idempotencyKey,
      status: BOOKING_STATUS.PENDING,
      offer: pricing.offerDiscountPercent > 0 ? offerId : undefined,
      offerDiscountPercent: pricing.offerDiscountPercent > 0 ? pricing.offerDiscountPercent : undefined,
      originalPricePerNight: pricing.originalPricePerNight,
    }], { session });

    await session.commitTransaction();

    // Extend lock so it covers the full hold duration
    if (lock) await extendLock(lock.lockKey, lock.lockValue, holdMs);

    return { booking, pricing, idempotencyKey, holdExpiresAt };
  } catch (error) {
    await session.abortTransaction();
    if (lock) releaseLock(lock.lockKey, lock.lockValue);
    throw error;
  } finally {
    session.endSession();
  }
};

const confirmPayment = async ({ bookingId }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });

  booking.isPaid = true;
  booking.status = BOOKING_STATUS.CONFIRMED;
  await booking.save();

  return booking;
};

export default {
  checkAvailability,
  calculateBookingPricing,
  createBooking,
  confirmPayment,
};
