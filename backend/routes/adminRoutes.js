import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/authorization.js";
import { getPlatformSettings, updatePlatformSettings, runAuditRetention } from "../controllers/platformSettingsController.js";
import { getHotelApprovals, updateHotelApproval, getHotelDocuments } from "../controllers/adminApprovalController.js";
import { getRevenueReport, getHotelPerformanceReport, getPaymentsReport } from "../controllers/adminReportsController.js";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import Booking from "../models/Booking.js";
import Role from "../models/Role.js";
import Room from "../models/Room.js";
import AuditLog from "../models/AuditLog.js";
import escapeRegex from "../utils/escapeRegex.js";

const adminRouter = express.Router();

// All admin routes require super_admin role
adminRouter.use(protect, requireRole("super_admin"));

// ---------------------------------------------------------------------------
// Platform stats
// ---------------------------------------------------------------------------
adminRouter.get("/stats", async (req, res) => {
  try {
    const [userCount, hotelCount, bookingCount, roleCount, managerCount, receptionistCount] = await Promise.all([
      User.countDocuments(),
      Hotel.countDocuments(),
      Booking.countDocuments(),
      Role.countDocuments(),
      User.countDocuments({ role: "hotel_manager" }),
      User.countDocuments({ role: "receptionist" }),
    ]);
    res.json({
      success: true,
      stats: { userCount, hotelCount, bookingCount, roleCount, managerCount, receptionistCount },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------
adminRouter.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      const safeSearch = escapeRegex(String(search));
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }
    const users = await User.find(query)
      .select("_id name email username role image assignedHotel createdAt")
      .populate("assignedHotel", "name city")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

adminRouter.patch("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = User.schema.path("status").enumValues;
    if (!allowedStatuses.includes(status)) {
      return res.json({ success: false, message: `Status must be one of: ${allowedStatuses.join(", ")}` });
    }
    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select("_id name email username role status");
    if (!user) return res.json({ success: false, message: "User not found" });
    await AuditLog.create({
      actor: req.user._id,
      action: "update_user_status",
      module: "user",
      recordId: id,
      newValue: { status },
      ip: req.ip,
    });
    res.json({ success: true, message: `Status updated to ${status}`, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Hotel management
// ---------------------------------------------------------------------------
adminRouter.get("/hotels", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const hotels = await Hotel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("owner", "name email");
    const total = await Hotel.countDocuments();
    res.json({ success: true, hotels, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
adminRouter.get("/bookings", async (req, res) => {
  try {
    const { page = 1, limit = 20, status, hotel, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (hotel) query.hotel = hotel;
    if (search) {
      const safeSearch = escapeRegex(String(search));
      query.$or = [
        { guestDisplayName: { $regex: safeSearch, $options: "i" } },
        { guestEmail: { $regex: safeSearch, $options: "i" } },
      ];
    }
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("user", "name email image")
      .populate("hotel", "name city")
      .populate("room", "roomNumber roomType images pricePerNight");
    const total = await Booking.countDocuments(query);
    res.json({ success: true, bookings, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Rooms (platform-wide)
// ---------------------------------------------------------------------------
adminRouter.get("/rooms", async (req, res) => {
  try {
    const { page = 1, limit = 20, hotel, roomType, availability } = req.query;
    const query = {};
    if (hotel) query.hotel = hotel;
    if (roomType) query.roomType = roomType;
    if (availability === "available") query.isAvailable = true;
    if (availability === "unavailable") query.isAvailable = false;
    const rooms = await Room.find(query)
      .populate("hotel", "name city address")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Room.countDocuments(query);
    res.json({ success: true, rooms, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

adminRouter.patch("/rooms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable, status } = req.body;
    const room = await Room.findById(id);
    if (!room) return res.json({ success: false, message: "Room not found" });

    if (status !== undefined) {
      const allowedStatuses = Room.schema.path("status").enumValues;
      if (!allowedStatuses.includes(status)) {
        return res.json({ success: false, message: `Status must be one of: ${allowedStatuses.join(", ")}` });
      }
      room.status = status;
      room.isAvailable = status === "available";
    } else if (isAvailable !== undefined) {
      room.isAvailable = isAvailable === true || isAvailable === "true";
      if (room.isAvailable) room.status = "available";
      else if (room.status === "available") room.status = "out_of_service";
    }

    await room.save();
    res.json({ success: true, message: "Room updated", room });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Guests
// ---------------------------------------------------------------------------
adminRouter.get("/guests", async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: "guest" };
    if (search) {
      const safeSearch = escapeRegex(String(search));
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }
    const users = await User.find(query)
      .select("_id name email username image role status createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(query);

    const ids = users.map((u) => u._id);
    const stats = await Booking.aggregate([
      { $match: { user: { $in: ids } } },
      {
        $group: {
          _id: "$user",
          bookings: { $sum: 1 },
          totalSpent: { $sum: "$totalPrice" },
          lastBooking: { $max: "$createdAt" },
        },
      },
    ]);
    const statsMap = new Map(stats.map((s) => [s._id, s]));
    const guests = users.map((u) => {
      const s = statsMap.get(u._id) || { bookings: 0, totalSpent: 0, lastBooking: null };
      return { ...u.toObject(), bookings: s.bookings, totalSpent: s.totalSpent, lastBooking: s.lastBooking };
    });
    res.json({ success: true, guests, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

adminRouter.get("/guests/:id", async (req, res) => {
  try {
    const guest = await User.findById(req.params.id).select(
      "_id name email username image role status profile recentSearchedCities createdAt"
    );
    if (!guest) return res.json({ success: false, message: "Guest not found" });
    const bookings = await Booking.find({ user: guest._id })
      .sort({ createdAt: -1 })
      .populate("hotel", "name city")
      .populate("room", "roomNumber roomType images pricePerNight");
    res.json({ success: true, guest, bookings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Hotel Managers — list, create, reassign, suspend
// ---------------------------------------------------------------------------
adminRouter.get("/managers", async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: "hotel_manager" };
    if (search) {
      const safeSearch = escapeRegex(String(search));
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }
    const managers = await User.find(query)
      .select("_id name email username image role status assignedHotel createdAt")
      .populate("assignedHotel", "name city")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, managers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

adminRouter.patch("/managers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedHotel, status } = req.body;
    const updates = {};
    if (assignedHotel !== undefined) updates.assignedHotel = assignedHotel || null;
    if (status !== undefined) updates.status = status;
    const manager = await User.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .select("_id name email role status assignedHotel")
      .populate("assignedHotel", "name city");
    if (!manager) return res.json({ success: false, message: "Manager not found" });
    await AuditLog.create({
      actor: req.user._id,
      action: "update_manager",
      module: "user",
      recordId: id,
      newValue: updates,
      ip: req.ip,
    });
    res.json({ success: true, message: "Manager updated", manager });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Audit Logs — recent platform activity from the AuditLog collection
// ---------------------------------------------------------------------------
adminRouter.get("/audit-logs", async (req, res) => {
  try {
    const { page = 1, limit = 20, module: moduleFilter, actor } = req.query;
    const query = {};
    if (moduleFilter) query.module = moduleFilter;
    if (actor) query.actor = actor;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate("actor", "name email"),
      AuditLog.countDocuments(query),
    ]);
    res.json({
      success: true,
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// System Settings — platform configuration (retention, loyalty, inventory)
// ---------------------------------------------------------------------------
adminRouter.get("/settings", getPlatformSettings);
adminRouter.put("/settings", updatePlatformSettings);
adminRouter.post("/settings/run-audit-retention", runAuditRetention);

// ---------------------------------------------------------------------------
// Hotel approval workflow
// ---------------------------------------------------------------------------
adminRouter.get("/hotel-approvals", getHotelApprovals);
adminRouter.patch("/hotels/:id/approval", updateHotelApproval);
adminRouter.get("/hotels/:id/documents", getHotelDocuments);

// ---------------------------------------------------------------------------
// Reports (revenue, hotel performance, payments)
// ---------------------------------------------------------------------------
adminRouter.get("/reports/revenue", getRevenueReport);
adminRouter.get("/reports/hotels", getHotelPerformanceReport);
adminRouter.get("/payments", getPaymentsReport);

export default adminRouter;
