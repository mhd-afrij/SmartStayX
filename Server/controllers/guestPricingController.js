import {
  getBestValueRooms,
  getCheapestDates,
  getPriceForecast,
} from '../services/guestPricingService.js';

export const bestValueRooms = async (req, res) => {
  try {
    const { city, budget, roomType, hotelId, limit } = req.query;
    const rooms = await getBestValueRooms({
      city,
      budget: budget ? Number(budget) : 500,
      roomType,
      hotelId,
      limit: limit ? Number(limit) : 20,
    });
    res.json({ success: true, rooms, count: rooms.length });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const cheapestDates = async (req, res) => {
  try {
    const { roomId, hotelId, monthsAhead } = req.query;
    const result = await getCheapestDates({
      roomId,
      hotelId,
      monthsAhead: monthsAhead ? Number(monthsAhead) : 2,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const priceForecast = async (req, res) => {
  try {
    const { roomId } = req.query;
    if (!roomId) return res.json({ success: false, message: 'roomId is required' });
    const forecast = await getPriceForecast({ roomId });
    res.json({ success: true, ...forecast });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

