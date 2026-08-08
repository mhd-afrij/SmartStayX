// dynamicPricingService.js — AI-driven dynamic pricing suggestions based on demand, season, and occupancy
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import { BOOKING_STATUS } from '../constants/bookingStatuses.js';
import logger from '../utils/logger.js';

const getDaysRange = (range) => {
  switch (range) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    default: return 30;
  }
};

const getSeasonMultiplier = (date) => {
  const month = date.getMonth();
  if (month >= 5 && month <= 8) return 1.2;
  if (month === 11 || month === 0 || month === 1) return 1.15;
  return 1.0;
};

export const suggestDynamicPricing = async ({ hotelId, roomType, range = '30d' } = {}) => {
  const days = getDaysRange(range);
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const matchStage = { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] };

  const baseQuery = {
    createdAt: { $gte: startDate },
    status: matchStage,
  };
  if (hotelId) {
    baseQuery.hotel = hotelId;
  }

  const bookings = await Booking.find(baseQuery)
    .populate('room', 'roomType pricePerNight isAvailable')
    .populate('hotel', 'name city pricingRules')
    .lean();

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  const totalBookings = bookings.length;

  const roomMetrics = {};
  bookings.forEach((b) => {
    const roomId = b.room?._id?.toString();
    if (!roomId) return;
    if (!roomMetrics[roomId]) {
      roomMetrics[roomId] = {
        roomId,
        roomType: b.room?.roomType || roomType || '',
        currentPrice: Number(b.room?.pricePerNight) || 0,
        bookings: 0,
        revenue: 0,
      };
    }
    roomMetrics[roomId].bookings += 1;
    roomMetrics[roomId].revenue += Number(b.totalPrice) || 0;
  });

  const suggestions = Object.values(roomMetrics).map((rm) => {
    const avgRate = rm.bookings > 0 ? rm.revenue / rm.bookings : rm.currentPrice;
    const demandFactor = Math.min(1.5, 0.8 + (rm.bookings / Math.max(1, totalBookings)) * 0.7);
    const seasonMult = getSeasonMultiplier(now);

    let suggestedPrice = Math.round(avgRate * demandFactor * seasonMult);
    if (suggestedPrice < rm.currentPrice * 0.7) suggestedPrice = Math.round(rm.currentPrice * 0.7);
    if (suggestedPrice > rm.currentPrice * 1.5) suggestedPrice = Math.round(rm.currentPrice * 1.5);

    const confidence = totalBookings > 20 ? 'high' : totalBookings > 5 ? 'medium' : 'low';

    return {
      roomId: rm.roomId,
      roomType: rm.roomType,
      currentPrice: rm.currentPrice,
      suggestedPrice,
      changePercent: rm.currentPrice > 0 ? Math.round(((suggestedPrice - rm.currentPrice) / rm.currentPrice) * 100) : 0,
      bookings: rm.bookings,
      avgRate: Math.round(avgRate),
      demandFactor: Number(demandFactor.toFixed(2)),
      seasonMultiplier: seasonMult,
      confidence,
    };
  });

  suggestions.sort((a, b) => b.bookings - a.bookings);

  return {
    range,
    hotelId,
    totalBookings,
    totalRevenue: Math.round(totalRevenue),
    generatedAt: now.toISOString(),
    suggestions: suggestions.slice(0, 50),
  };
};

export const getOccupancyRate = async ({ hotelId, range = '30d' } = {}) => {
  const days = getDaysRange(range);
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const matchStage = { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] };

  const pipeline = [
    { $match: { createdAt: { $gte: startDate }, status: matchStage } },
    {
      $group: {
        _id: '$room',
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalPrice' },
      },
    },
    {
      $lookup: {
        from: 'rooms',
        localField: '_id',
        foreignField: '_id',
        as: 'room',
      },
    },
    { $unwind: { path: '$room', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'hotels',
        localField: 'room.hotel',
        foreignField: '_id',
        as: 'hotel',
      },
    },
    { $unwind: { path: '$hotel', preserveNullAndEmptyArrays: true } },
  ];

  if (hotelId) {
    pipeline.splice(3, 0, { $match: { 'room.hotel': hotelId } });
  }

  const results = await Booking.aggregate(pipeline);

  const overall = {
    totalBookings: 0,
    totalRevenue: 0,
    roomsWithBookings: results.length,
  };

  results.forEach((r) => {
    overall.totalBookings += r.bookings;
    overall.totalRevenue += r.revenue || 0;
  });

  return {
    range,
    hotelId,
    overall,
    rooms: results.map((r) => ({
      roomId: r._id,
      roomType: r.room?.roomType,
      hotelName: r.hotel?.name,
      bookings: r.bookings,
      revenue: r.revenue || 0,
    })),
  };
};

export default { suggestDynamicPricing, getOccupancyRate };
