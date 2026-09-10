// pricingController.js — AI-driven dynamic pricing, occupancy analytics, and revenue forecasting
import dynamicPricingService from '../services/dynamicPricingService.js';
import revenueForecastService from '../services/revenueForecastService.js';
import Room from '../models/Room.js';
import logger from '../utils/logger.js';

export const suggestPricing = async (req, res) => {
  try {
    const { hotelId, roomType, range } = req.query;
    const result = await dynamicPricingService.suggestDynamicPricing({ hotelId, roomType, range });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOccupancy = async (req, res) => {
  try {
    const { hotelId, range } = req.query;
    const result = await dynamicPricingService.getOccupancyRate({ hotelId, range });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePrice = async (req, res) => {
  try {
    const { roomId, suggestedPrice } = req.body;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // Enforce hotel scope: non-super-admins may only price rooms within their
    // assigned hotel, even when a roomId is passed without a hotelId.
    if (req.user?.role !== "super_admin") {
      const scopeHotelId = String(req.scopeHotelId || "");
      const roomHotelId = String(room.hotel || "");
      if (!scopeHotelId || roomHotelId !== scopeHotelId) {
        return res.status(403).json({ success: false, message: "Access denied: hotel scope violation" });
      }
    }

    room.pricePerNight = Number(suggestedPrice);
    await room.save();
    logger.info('price updated for room %s -> %s', roomId, suggestedPrice);
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Revenue + occupancy + seasonal demand forecast (7/30/90 day windows)
export const getRevenueForecast = async (req, res) => {
  try {
    const { range = 30 } = req.query;
    const result = await revenueForecastService.forecast({
      hotelId: req.scopeHotelId || req.query.hotelId || undefined,
      range: Number(range),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// AI pricing suggestions backed by the forecast + ML insights
export const getPricingSuggestions = async (req, res) => {
  try {
    const { range = "30d" } = req.query;
    const result = await revenueForecastService.suggestions({
      hotelId: req.scopeHotelId || req.query.hotelId || undefined,
      range,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
