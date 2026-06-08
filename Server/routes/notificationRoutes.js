import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later" },
});

notificationRouter.get("/", limiter, protect, getNotifications);
notificationRouter.put("/:notificationId/read", limiter, protect, markAsRead);
notificationRouter.put("/read-all", limiter, protect, markAllAsRead);

export default notificationRouter;
