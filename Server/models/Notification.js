// Notification.js — Notification schema: type, message, read status, and user target
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    type: {
      type: String,
      enum: ["new_booking", "payment_received", "check_in", "check_out", "maintenance", "cancellation", "review", "refund_request"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ hotel: 1, createdAt: -1 });
notificationSchema.index({ hotel: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
