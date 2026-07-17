// Checkin.js — Guest self-service check-in/check-out schema
import mongoose from "mongoose";

const checkinSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  user: { type: String, ref: "User", required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "checked_in", "rejected", "checked_out"],
    default: "pending",
  },
  documents: [{
    type: { type: String, enum: ["id_card", "passport", "drivers_license", "other"], required: true },
    documentNumber: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    verified: { type: Boolean, default: false },
  }],
  vehicleInfo: {
    hasVehicle: { type: Boolean, default: false },
    licensePlate: { type: String, default: "" },
    vehicleModel: { type: String, default: "" },
  },
  estimatedArrivalTime: { type: String, default: "" },
  specialRequests: { type: String, default: "" },
  checkedInAt: { type: Date },
  checkedOutAt: { type: Date },
}, { timestamps: true });

const Checkin = mongoose.model("Checkin", checkinSchema);

export default Checkin;
