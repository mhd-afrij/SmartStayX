// analyticsService.js — Trend analysis and tourist analytics aggregation
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import Destination from '../models/Destination.js';
import Review from '../models/Review.js';
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

const startDate = (range) => new Date(Date.now() - getDaysRange(range) * 24 * 60 * 60 * 1000);

export const getBookingTrends = async ({ hotelId, range = '30d', granularity = 'day' } = {}) => {
  const from = startDate(range);
  const matchStage = { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] };
  const matchHotel = hotelId ? { hotel: hotelId } : {};

  const dateFormat = granularity === 'week' ? '%Y-%U' : granularity === 'month' ? '%Y-%m' : '%Y-%m-%d';

  const pipeline = [
    { $match: { createdAt: { $gte: from }, status: matchStage, ...matchHotel } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalPrice' },
      },
    },
    { $sort: { '_id': 1 } },
  ];

  const data = await Booking.aggregate(pipeline);

  return {
    range,
    granularity,
    totalBookings: data.reduce((s, d) => s + d.bookings, 0),
    totalRevenue: data.reduce((s, d) => s + d.revenue, 0),
    trend: data.map((d) => ({
      period: d._id,
      bookings: d.bookings,
      revenue: Math.round(d.revenue || 0),
    })),
  };
};

export const getPopularDestinations = async ({ limit = 10 } = {}) => {
  const pipeline = [
    { $match: { status: { $ne: BOOKING_STATUS.CANCELLED } } },
    { $group: { _id: '$hotel', bookings: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
    { $sort: { bookings: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'hotels',
        localField: '_id',
        foreignField: '_id',
        as: 'hotel',
      },
    },
    { $unwind: { path: '$hotel', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        hotelName: { $ifNull: ['$hotel.name', 'Unknown'] },
        city: { $ifNull: ['$hotel.city', 'Unknown'] },
        bookings: 1,
        revenue: { $round: ['$revenue', 2] },
      },
    },
  ];

  const data = await Booking.aggregate(pipeline);
  return data;
};

export const getRevenueAnalytics = async ({ hotelId, range = '30d' } = {}) => {
  const from = startDate(range);
  const match = { createdAt: { $gte: from }, isPaid: true };
  if (hotelId) match.hotel = hotelId;

  const bookings = await Booking.find(match)
    .populate('hotel', 'name city')
    .lean();

  const totalRevenue = bookings.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
  const paidBookings = bookings.length;
  const avgOrderValue = paidBookings > 0 ? totalRevenue / paidBookings : 0;

  const paymentMethodBreakdown = {};
  bookings.forEach((b) => {
    const method = b.paymentMethod || 'Unknown';
    paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + 1;
  });

  const byHotel = {};
  bookings.forEach((b) => {
    const name = b.hotel?.name || 'Unknown';
    if (!byHotel[name]) byHotel[name] = { revenue: 0, bookings: 0 };
    byHotel[name].revenue += Number(b.totalPrice) || 0;
    byHotel[name].bookings += 1;
  });

  return {
    range,
    summary: {
      totalRevenue: Math.round(totalRevenue),
      paidBookings,
      avgOrderValue: Math.round(avgOrderValue),
    },
    paymentMethods: paymentMethodBreakdown,
    topHotels: Object.entries(byHotel)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([name, data]) => ({ name, ...data, revenue: Math.round(data.revenue) })),
  };
};

export const getGuestDemographics = async ({ range = '30d' } = {}) => {
  const from = startDate(range);
  const match = { createdAt: { $gte: from }, status: { $ne: BOOKING_STATUS.CANCELLED } };

  const bookings = await Booking.find(match)
    .populate('hotel', 'name city')
    .lean();

  const byGroupSize = {};
  const byCity = {};
  const byMonth = {};

  bookings.forEach((b) => {
    const size = String(b.guests || 1);
    byGroupSize[size] = (byGroupSize[size] || 0) + 1;

    const city = b.hotel?.city || 'Unknown';
    byCity[city] = (byCity[city] || 0) + 1;

    const monthKey = b.checkInDate ? new Date(b.checkInDate).toISOString().slice(0, 7) : 'Unknown';
    byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
  });

  return {
    range,
    totalBookings: bookings.length,
    groupSize: Object.entries(byGroupSize).map(([size, count]) => ({ size, count })),
    topCities: Object.entries(byCity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({ city, count })),
    monthlyTrend: Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
  };
};

export default { getBookingTrends, getPopularDestinations, getRevenueAnalytics, getGuestDemographics };
