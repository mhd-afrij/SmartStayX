// analyticsController.js — Trend analysis and tourist analytics endpoints
// Hotel managers are scoped to their hotel via requireHotelScope middleware,
// which sets req.scopeHotelId. Super admins see platform-wide data.
import analyticsService from '../services/analyticsService.js';

const resolveHotelId = (req) => req.scopeHotelId || req.query?.hotelId || undefined;

export const getBookingTrends = async (req, res) => {
  try {
    const { range, granularity } = req.query;
    const result = await analyticsService.getBookingTrends({ hotelId: resolveHotelId(req), range, granularity });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPopularDestinations = async (req, res) => {
  try {
    const { limit } = req.query;
    const result = await analyticsService.getPopularDestinations({ hotelId: resolveHotelId(req), limit });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const { range } = req.query;
    const result = await analyticsService.getRevenueAnalytics({ hotelId: resolveHotelId(req), range });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGuestDemographics = async (req, res) => {
  try {
    const { range } = req.query;
    const result = await analyticsService.getGuestDemographics({ hotelId: resolveHotelId(req), range });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
