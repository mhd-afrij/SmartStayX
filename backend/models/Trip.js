// Trip.js — Saved trip schema: hotel-anchored routes with ordered stops.
import mongoose from "mongoose";

const tripStopSchema = new mongoose.Schema(
  {
    placeId: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    category: { type: String, default: "" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    stopDuration: { type: Number, default: 0, min: 0 }, // minutes
    photoUrl: { type: String, default: "" },
    rating: { type: Number, default: 0 },
  },
  { _id: true }
);

const tripSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
    owner: { type: String, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 500 },
    startLocation: {
      name: { type: String, required: true },
      address: { type: String, default: "" },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    stops: [tripStopSchema],
    totalDistanceKm: { type: Number, default: 0, min: 0 },
    totalDurationMin: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["draft", "planned", "completed", "archived"], default: "draft" },
  },
  { timestamps: true }
);

tripSchema.index({ owner: 1, updatedAt: -1 });

const Trip = mongoose.model("Trip", tripSchema);
export default Trip;
