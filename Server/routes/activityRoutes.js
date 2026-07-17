// activityRoutes.js — Activity and excursion booking routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getActivities, getActivityById, createActivity, updateActivity, deleteActivity,
  bookActivity, getUserActivityBookings, cancelActivityBooking,
  getHotelActivityBookings, updateActivityBookingStatus,
} from "../controllers/activityController.js";

const activityRouter = express.Router();

activityRouter.get("/", getActivities);
activityRouter.get("/:id", getActivityById);
activityRouter.post("/", protect, createActivity);
activityRouter.put("/:id", protect, updateActivity);
activityRouter.delete("/:id", protect, deleteActivity);
activityRouter.post("/book", protect, bookActivity);
activityRouter.get("/user/bookings", protect, getUserActivityBookings);
activityRouter.post("/cancel", protect, cancelActivityBooking);
activityRouter.get("/hotel/bookings", protect, getHotelActivityBookings);
activityRouter.patch("/bookings/:id/status", protect, updateActivityBookingStatus);

export default activityRouter;
