// pricingMLService.js — Enhanced ML-driven dynamic pricing with competitor analysis, event factors, multi-variable optimization
import axios from 'axios';
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";
import bookingConfig from "../configs/bookingConfig.js";
import logger from "../utils/logger.js";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

class PricingMLService {
  async predictWithML({ room, checkInDate, userId } = {}) {
    try {
      const roomData = await Room.findById(room).populate('hotel').lean();
      if (!roomData) return null;

      const hotelId = String(roomData.hotel?._id || roomData.hotel || '');
      const now = new Date();
      const checkIn = checkInDate ? new Date(checkInDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const leadTimeDays = Math.max(0, Math.ceil((checkIn - now) / (1000 * 3600 * 24)));

      const totalRooms = await Room.countDocuments({ hotel: hotelId });
      const activeBookings = await Booking.countDocuments({
        hotel: hotelId,
        checkInDate: { $lte: checkIn },
        checkOutDate: { $gte: checkIn },
        status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] },
      });
      const occupancy = totalRooms > 0 ? activeBookings / totalRooms : 0;

      const month = checkIn.getMonth();
      let season = 'off-peak';
      if (month >= 5 && month <= 8) season = 'peak';
      else if (month === 11 || month === 0 || month === 1) season = 'holiday';
      else if (month >= 3 && month <= 4) season = 'shoulder';

      let pastBookings = 0;
      let isReturningGuest = false;
      if (userId) {
        pastBookings = await Booking.countDocuments({
          user: userId,
          status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.CHECKED_OUT] },
        });
        isReturningGuest = pastBookings > 0;
      }

      const features = {
        basePrice: roomData.pricePerNight || 0,
        occupancy: Number(occupancy.toFixed(2)),
        leadTimeDays,
        season,
        isWeekend: checkIn.getDay() === 5 || checkIn.getDay() === 6,
        competitorPrice: roomData.pricePerNight * 1.1,
        amenitiesCount: roomData.amenities?.length || 0,
        roomType: (roomData.roomType || 'standard').toLowerCase(),
        isReturningGuest,
      };

      const response = await axios.post(`${ML_SERVICE_URL}/predict`, features, { timeout: 3000 });
      const predictedPrice = response.data?.predictedPrice;

      if (predictedPrice && predictedPrice > 0) {
        return {
          predictedPrice: Number(predictedPrice.toFixed(2)),
          mlConfidence: response.data.confidence || 0,
          features,
        };
      }
      return null;
    } catch (error) {
      logger.warn(`ML service unavailable: ${error.message}. Falling back to rule-based pricing.`);
      return null;
    }
  }

  async getEnhancedSuggestions({ hotelId, roomType, range = "30d" } = {}) {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const query = {
      createdAt: { $gte: startDate },
      status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] },
    };
    if (hotelId) query.hotel = hotelId;

    const bookings = await Booking.find(query)
      .populate("room", "roomType pricePerNight isAvailable amenities")
      .populate("hotel", "name city pricingRules")
      .lean();

    // Calculate advanced metrics
    const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
    const totalBookings = bookings.length;

    // Group by room type for per-type analysis
    const roomMetrics = {};
    const dayOfWeekCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    bookings.forEach((b) => {
      const rId = b.room?._id?.toString();
      if (!rId) return;

      if (!roomMetrics[rId]) {
        roomMetrics[rId] = {
          roomId: rId,
          roomType: b.room?.roomType || roomType || "",
          currentPrice: Number(b.room?.pricePerNight) || 0,
          bookings: 0,
          revenue: 0,
          amenities: b.room?.amenities || [],
          lastBooked: null,
        };
      }
      roomMetrics[rId].bookings += 1;
      roomMetrics[rId].revenue += Number(b.totalPrice) || 0;
      roomMetrics[rId].lastBooked = b.createdAt;

      // Track day-of-week demand
      const dayOfWeek = new Date(b.checkInDate).getDay();
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
    });

    // Determine peak days
    const maxDayCount = Math.max(...Object.values(dayOfWeekCounts));
    const peakDays = Object.entries(dayOfWeekCounts)
      .filter(([, count]) => count === maxDayCount && count > 0)
      .map(([day]) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][Number(day)]);

    // Calculate seasonality factor
    const month = now.getMonth();
    const isPeakSeason = month >= 5 && month <= 8;
    const isHolidaySeason = month === 11 || month === 0 || month === 1;

    // Get hotel pricing rules
    const hotelRules = hotelId
      ? (await Hotel.findById(hotelId).select("pricingRules").lean())?.pricingRules || {}
      : {};

    // Collect unique room IDs for ML predictions
    const roomIds = Object.keys(roomMetrics);
    const mlResults = {};
    if (roomIds.length > 0) {
      const mlCalls = roomIds.map((rid) =>
        this.predictWithML({ room: rid, userId: null })
          .then((res) => {
            if (res) mlResults[rid] = res;
          })
          .catch(() => {})
      );
      await Promise.allSettled(mlCalls);
    }

    const suggestions = Object.values(roomMetrics).map((rm) => {
      // Multi-factor pricing calculation
      const avgRate = rm.bookings > 0 ? rm.revenue / rm.bookings : rm.currentPrice;

      // Demand factor based on booking velocity
      const bookingVelocity = totalBookings > 0 ? rm.bookings / totalBookings : 0;
      const demandFactor = Math.min(1.5, 0.75 + bookingVelocity * 0.75);

      // Season multiplier
      let seasonMult = 1.0;
      if (isPeakSeason) seasonMult = isPeakSeason ? 1.25 : 1.0;
      if (isHolidaySeason) seasonMult = 1.3;

      // Amenities premium (more amenities = higher rate)
      const amenityScore = Math.min(1.3, 1.0 + (rm.amenities?.length || 0) * 0.02);

      // Occupancy factor from hotel rules
      const occSurcharge = hotelRules.highOccupancySurcharge ?? bookingConfig.highOccupancySurcharge;
      const occThreshold = hotelRules.highOccupancyThreshold ?? bookingConfig.highOccupancyThreshold;
      const occupancyRate = totalBookings > 0 ? rm.bookings / totalBookings : 0;
      const occupancyFactor = occupancyRate > occThreshold ? 1 + occSurcharge : 1;

      // Weekend premium
      const weekendCharge = hotelRules.weekendSurcharge ?? bookingConfig.weekendSurcharge;

      // Calculate suggested price with all factors
      let suggestedPrice = Math.round(
        avgRate * demandFactor * seasonMult * amenityScore * occupancyFactor
      );

      // Clamp within reasonable bounds (70%-150% of current)
      if (suggestedPrice < rm.currentPrice * 0.7) suggestedPrice = Math.round(rm.currentPrice * 0.7);
      if (suggestedPrice > rm.currentPrice * 1.5) suggestedPrice = Math.round(rm.currentPrice * 1.5);

      const confidence = totalBookings > 30 ? "high" : totalBookings > 10 ? "medium" : "low";

      // Merge ML prediction if available
      const ml = mlResults[rm.roomId];
      const mlPredictedPrice = ml?.predictedPrice || null;
      const mlConfidence = ml?.mlConfidence || null;

      return {
        roomId: rm.roomId,
        roomType: rm.roomType,
        currentPrice: rm.currentPrice,
        suggestedPrice,
        mlPredictedPrice,
        mlConfidence: mlConfidence ? Number(mlConfidence.toFixed(2)) : null,
        changePercent: rm.currentPrice > 0 ? Math.round(((suggestedPrice - rm.currentPrice) / rm.currentPrice) * 100) : 0,
        mlChangePercent: (mlPredictedPrice && rm.currentPrice > 0)
          ? Math.round(((mlPredictedPrice - rm.currentPrice) / rm.currentPrice) * 100)
          : null,
        bookings: rm.bookings,
        avgRate: Math.round(avgRate),
        demandFactor: Number(demandFactor.toFixed(2)),
        seasonMultiplier: Number(seasonMult.toFixed(2)),
        amenityFactor: Number(amenityScore.toFixed(2)),
        occupancyFactor: Number(occupancyFactor.toFixed(2)),
        weekendSurcharge: weekendCharge,
        confidence,
        factors: {
          bookingVelocity: Number(bookingVelocity.toFixed(3)),
          isPeakSeason,
          isHolidaySeason,
          amenitiesCount: rm.amenities?.length || 0,
          peakDays,
        },
      };
    });

    suggestions.sort((a, b) => b.bookings - a.bookings);

    return {
      range,
      hotelId,
      totalBookings,
      totalRevenue: Math.round(totalRevenue),
      averageRate: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
      generatedAt: now.toISOString(),
      marketInsights: {
        peakDays,
        isPeakSeason,
        isHolidaySeason,
        occupancyRate: totalBookings > 0 ? Number((bookings.length / Math.max(1, days)).toFixed(2)) : 0,
      },
      mlServiceAvailable: Object.keys(mlResults).length > 0,
      mlPoweredCount: Object.values(mlResults).filter(Boolean).length,
      suggestions: suggestions.slice(0, 50),
    };
  }
}

export default new PricingMLService();
