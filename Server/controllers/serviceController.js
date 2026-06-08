import mongoose from 'mongoose';
import ServiceRequest from "../models/ServiceRequest.js";
import Staff from "../models/Staff.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";

const ROLE_MAP = {
  Housekeeping: "Housekeeping",
  Maintenance: "Maintenance",
  "Room Service": "Room Service",
  Other: "Front Desk",
};

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

    const requiredRole = ROLE_MAP[serviceType] || "Front Desk";

    const availableStaff = await Staff.find({
      hotel: hotelId,
      role: requiredRole,
      isAvailable: true,
    });

    availableStaff.sort((a, b) => a.assignedRequests.length - b.assignedRequests.length);
    const assignedStaff = availableStaff.length > 0 ? availableStaff[0] : null;

    const newRequest = await ServiceRequest.create({
      guest: guestId,
      hotel: hotelId,
      room: roomId,
      serviceType,
      requestDetails,
      status: assignedStaff ? "assigned" : "pending",
      staffAssigned: assignedStaff ? assignedStaff._id : null,
    });

    if (assignedStaff) {
      assignedStaff.assignedRequests.push(newRequest._id);
      await assignedStaff.save();
    }

    res.json({
      success: true,
      message: assignedStaff
        ? `Request assigned to ${assignedStaff.name}`
        : "Request received and pending assignment.",
      requestId: newRequest._id,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

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

      if (request.staffAssigned) {
        await Staff.findByIdAndUpdate(request.staffAssigned, {
          $pull: { assignedRequests: request._id },
        });
      }
    } else if (status === "cancelled") {
      request.status = "cancelled";
      if (request.staffAssigned) {
        await Staff.findByIdAndUpdate(request.staffAssigned, {
          $pull: { assignedRequests: request._id },
        });
      }
    }

    await request.save();
    res.json({ success: true, message: `Service marked as ${status}` });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

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
      .populate("staffAssigned room guest")
      .sort({ createdAt: -1 });

    res.json({ success: true, history });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const addStaff = async (req, res) => {
  try {
    const { name, role, hotelId } = req.body;
    if (typeof hotelId !== 'string') return res.json({ success: false, message: 'Invalid hotel ID' });
    const staff = await Staff.create({ name, role, hotel: hotelId });
    res.json({ success: true, staff });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getStaffList = async (req, res) => {
  try {
    const { hotelId } = req.query;
    const ownerId = req.user?._id;

    if (!ownerId) {
      return res.json({ success: false, message: "User not authenticated" });
    }

    const ownedHotels = await Hotel.find({ owner: ownerId }).select("_id");
    if (!ownedHotels.length) {
      return res.json({ success: true, staff: [] });
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

    const staff = await Staff.find(hotelMatch)
      .populate("assignedRequests")
      .sort({ createdAt: -1 });

    const staffWithWorkload = staff.map((s) => ({
      ...s.toObject(),
      workload: s.assignedRequests?.length || 0,
    }));

    res.json({ success: true, staff: staffWithWorkload });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'Invalid staff ID' });
    }

    const staff = await Staff.findByIdAndUpdate(id, { name, role }, { new: true });
    if (!staff) return res.json({ success: false, message: "Staff not found" });
    res.json({ success: true, staff });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') return res.json({ success: false, message: "Staff not found" });
    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) return res.json({ success: false, message: "Staff not found" });
    res.json({ success: true, message: "Staff removed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const toggleStaffAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') return res.json({ success: false, message: "Staff not found" });
    const staff = await Staff.findById(id);
    if (!staff) return res.json({ success: false, message: "Staff not found" });
    staff.isAvailable = !staff.isAvailable;
    await staff.save();
    res.json({ success: true, staff });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getServiceStats = async (req, res) => {
  try {
    const { hotelId } = req.query;
    const ownerId = req.user?._id;

    if (!ownerId) {
      return res.json({ success: false, message: "User not authenticated" });
    }

    const ownedHotels = await Hotel.find({ owner: ownerId }).select("_id");
    if (!ownedHotels.length) {
      return res.json({ success: true, stats: { pending: 0, assigned: 0, completed: 0, cancelled: 0, total: 0 } });
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

    const [pending, assigned, completed, cancelled] = await Promise.all([
      ServiceRequest.countDocuments({ ...hotelMatch, status: "pending" }),
      ServiceRequest.countDocuments({ ...hotelMatch, status: "assigned" }),
      ServiceRequest.countDocuments({ ...hotelMatch, status: "completed" }),
      ServiceRequest.countDocuments({ ...hotelMatch, status: "cancelled" }),
    ]);

    res.json({
      success: true,
      stats: { pending, assigned, completed, cancelled, total: pending + assigned + completed + cancelled },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
