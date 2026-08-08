// notificationRoutes.js — Notification delivery and preference routes
import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

// Rate limiter: max 100 requests per 15 minutes for notification endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later" },
});

// GET / — Get notifications for the authenticated user (rate-limited)
notificationRouter.get("/", limiter, protect, getNotifications);
// PUT /:notificationId/read — Mark a single notification as read (rate-limited)
notificationRouter.put("/:notificationId/read", limiter, protect, markAsRead);
// PUT /read-all — Mark all notifications as read for the user (rate-limited)
notificationRouter.put("/read-all", limiter, protect, markAllAsRead);

export default notificationRouter;
