// pricingController.js — AI-driven dynamic pricing and occupancy analytics
import dynamicPricingService from '../services/dynamicPricingService.js';
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
    room.pricePerNight = suggestedPrice;
    await room.save();
    logger.info('price updated for room %s -> %s', roomId, suggestedPrice);
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
