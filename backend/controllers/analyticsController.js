// analyticsController.js — Trend analysis and tourist analytics endpoints
import analyticsService from '../services/analyticsService.js';

export const getBookingTrends = async (req, res) => {
  try {
    const { hotelId, range, granularity } = req.query;
    const result = await analyticsService.getBookingTrends({ hotelId, range, granularity });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPopularDestinations = async (req, res) => {
  try {
    const { limit } = req.query;
    const result = await analyticsService.getPopularDestinations({ limit });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const { hotelId, range } = req.query;
    const result = await analyticsService.getRevenueAnalytics({ hotelId, range });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGuestDemographics = async (req, res) => {
  try {
    const { range } = req.query;
    const result = await analyticsService.getGuestDemographics({ range });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
