// ActivityBooking.js — Activity booking schema: excursions, tours, transportation
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  category: {
    type: String,
    enum: ["excursion", "tour", "transportation", "wellness", "dining", "entertainment", "other"],
    required: true,
  },
  duration: { type: String, default: "" },
  location: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "USD" },
  maxParticipants: { type: Number, default: 10 },
  availableSlots: { type: Number, default: 10 },
  images: [{ type: String }],
  includes: [{ type: String }],
  meetingPoint: { type: String, default: "" },
  startTime: { type: String, default: "" },
  availableDays: [{ type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }],
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

const activityBookingSchema = new mongoose.Schema({
  user: { type: String, ref: "User", required: true },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
  bookingDate: { type: Date, required: true },
  participants: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  specialRequests: { type: String, default: "" },
  paymentMethod: { type: String, default: "Pay At Hotel" },
  isPaid: { type: Boolean, default: false },
}, { timestamps: true });

const Activity = mongoose.model("Activity", activitySchema);
const ActivityBooking = mongoose.model("ActivityBooking", activityBookingSchema);

export { Activity, ActivityBooking };
