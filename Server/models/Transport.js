// Transport.js — Transport option schema: route, schedule, capacity, and pricing
import mongoose from "mongoose";

const transportSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    type: {
      type: String,
      enum: ["bus", "train", "flight", "taxi", "shuttle"],
      required: true,
    },
    provider: { type: String, default: "" },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    capacity: { type: Number, default: 1 },
    availableSeats: { type: Number, default: 1 },
  },
  { timestamps: true }
);

transportSchema.index({ from: 1, to: 1, departureTime: 1 });

const Transport = mongoose.model("Transport", transportSchema);
export default Transport;
