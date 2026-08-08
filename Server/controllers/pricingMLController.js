// pricingMLController.js — Enhanced pricing insights and ML-driven suggestions
import pricingMLService from "../services/pricingMLService.js";
import Room from "../models/Room.js";

export const getEnhancedSuggestions = async (req, res) => {
  try {
    const { hotelId, roomType, range } = req.query;
    const data = await pricingMLService.getEnhancedSuggestions({ hotelId, roomType, range });
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const predictPrice = async (req, res) => {
  try {
    const { roomId, checkInDate } = req.body;
    if (!roomId) return res.json({ success: false, message: 'roomId is required' });

    const user = req.user;
    const userId = user?._id || user?.id;

    const mlResult = await pricingMLService.predictWithML({ room: roomId, checkInDate, userId });

    if (mlResult) {
      return res.json({
        success: true,
        predictedPrice: mlResult.predictedPrice,
        confidence: mlResult.mlConfidence,
        source: 'ml',
        features: mlResult.features,
      });
    }

    const room = await Room.findById(roomId).lean();
    if (!room) return res.json({ success: false, message: 'Room not found' });

    return res.json({
      success: true,
      predictedPrice: room.pricePerNight,
      confidence: 0,
      source: 'base',
      message: 'ML service unavailable, using base price',
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
