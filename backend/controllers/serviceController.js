// serviceController.js — Room service request handling and status updates
import ServiceRequest from "../models/ServiceRequest.js";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";

// Create a service request from a guest
export const requestService = async (req, res) => {
  try {
    const { serviceType, requestDetails, roomId, hotelId } = req.body;
    const guestId = req.user._id;

    if (typeof roomId !== 'string' || typeof hotelId !== 'string') {
      return res.json({ success: false, message: 'Invalid room or hotel ID' });
    }

    const activeBooking = await Booking.findOne({
      user: guestId,
      room: roomId,
      hotel: hotelId,
      status: BOOKING_STATUS.CONFIRMED,
    });

    if (!activeBooking) {
      return res.json({ success: false, message: "No active booking found for this room/hotel." });
    }

    const roomDoc = await Room.findById(roomId).select('roomNumber');

    const newRequest = await ServiceRequest.create({
      guest: guestId,
      hotel: hotelId,
      room: roomId,
      roomNumber: roomDoc?.roomNumber || '',
      serviceType,
      requestDetails,
      status: "pending",
    });

    res.json({
      success: true,
      message: "Service request received.",
      requestId: newRequest._id,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update service request status (complete/cancel)
export const updateServiceStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    if (typeof requestId !== 'string') {
      return res.json({ success: false, message: 'Invalid request ID' });
    }

    const request = await ServiceRequest.findById(requestId);
    if (!request) return res.json({ success: false, message: "Request not found" });

    if (status === "completed") {
      request.status = "completed";
      request.completedAt = new Date();
      const durationMs = request.completedAt - request.requestedAt;
      const durationMin = Math.floor(durationMs / 60000);
      if (durationMin > 60) {
        request.delayMinutes = durationMin - 60;
      }
    } else if (status === "cancelled") {
      request.status = "cancelled";
    }

    await request.save();
    res.json({ success: true, message: `Service marked as ${status}` });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get service request history for a hotel (owner-only, scoped to owned hotels)
export const getHotelServiceHistory = async (req, res) => {
  try {
    const { hotelId } = req.query;
    const ownerId = req.user?._id;

    if (!ownerId) {
      return res.json({ success: false, message: "User not authenticated" });
    }

    const ownedHotels = await Hotel.find({ owner: ownerId }).select("_id");
    if (!ownedHotels.length) {
      return res.json({ success: true, history: [] });
    }

    const ownedHotelIds = ownedHotels.map((h) => h._id);

    let hotelMatch = {};
    if (!hotelId || hotelId === "all") {
      hotelMatch = { hotel: { $in: ownedHotelIds } };
    } else {
      const isOwned = ownedHotelIds.some((id) => String(id) === String(hotelId));
      if (!isOwned) {
        return res.json({ success: false, message: "Not authorized for this hotel" });
      }
      hotelMatch = { hotel: String(hotelId) };
    }

    const history = await ServiceRequest.find(hotelMatch)
      .populate("room guest")
      .sort({ createdAt: -1 });

    res.json({ success: true, history });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
