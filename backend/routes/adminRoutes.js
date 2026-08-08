import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/authorization.js";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import Booking from "../models/Booking.js";
import Role from "../models/Role.js";

const adminRouter = express.Router();

adminRouter.use(protect, requireRole("admin"));

adminRouter.get("/stats", async (req, res) => {
  try {
    const [userCount, hotelCount, bookingCount, roleCount] = await Promise.all([
      User.countDocuments(),
      Hotel.countDocuments(),
      Booking.countDocuments(),
      Role.countDocuments(),
    ]);
    res.json({ success: true, stats: { userCount, hotelCount, bookingCount, roleCount } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

adminRouter.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const users = await User.find(query)
      .select("_id name email username role image createdAt")
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
    res.json({ success: true, message: `Status updated to ${status}`, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

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

adminRouter.get("/bookings", async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("user", "name email")
      .populate("hotel", "name");
    const total = await Booking.countDocuments(query);
    res.json({ success: true, bookings, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

export default adminRouter;
