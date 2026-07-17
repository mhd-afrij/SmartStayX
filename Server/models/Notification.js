// Notification.js — Notification schema: type, message, read status, and user target
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true }, // Hotel this notification belongs to
    type: {
      type: String,
      enum: ["new_booking", "payment_received", "check_in", "check_out", "maintenance", "cancellation", "review", "room_assigned"],
      required: true,
    }, // Category of notification event
    title: { type: String, required: true }, // Short notification title
    message: { type: String, default: "" }, // Detailed notification body
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // Related booking reference
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" }, // Related room reference
    isRead: { type: Boolean, default: false }, // Whether the notification has been read
  },
  { timestamps: true }
);

notificationSchema.index({ hotel: 1, createdAt: -1 }); // Optimize fetching recent notifications per hotel
notificationSchema.index({ hotel: 1, isRead: 1 }); // Optimize unread notification queries per hotel

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
