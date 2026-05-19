import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", protect, getNotifications);
notificationRouter.put("/:notificationId/read", protect, markAsRead);
notificationRouter.put("/read-all", protect, markAllAsRead);

export default notificationRouter;
