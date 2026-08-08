// notificationController.js — Notification sending and user preference management
import Notification from "../models/Notification.js";
import Hotel from "../models/Hotel.js";

// List notifications for a Admin with pagination and unread filter
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    const hotels = await Hotel.find({ owner: userId });
    const hotelIds = hotels.map((h) => h._id);

    const { page = 1, limit = 20, unread } = req.query;
    const filter = { hotel: { $in: hotelIds } };
    if (unread === "true") filter.isRead = false;

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .populate("booking room")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      hotel: { $in: hotelIds },
      isRead: false,
    });

    res.json({
      success: true,
      notifications,
      total,
      unreadCount,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Mark a single notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Mark all unread notifications as read for a Admin
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    const hotels = await Hotel.find({ owner: userId });
    const hotelIds = hotels.map((h) => h._id);

    await Notification.updateMany(
      { hotel: { $in: hotelIds }, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
