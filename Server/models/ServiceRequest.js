// ServiceRequest.js — Service request schema: type, description, and status
import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    guest: { type: String, ref: "User", required: true }, // Clerk user ID of the requesting guest
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    roomNumber: { type: String, default: "" },
    serviceType: {
      type: String,
      enum: ["Housekeeping", "Maintenance", "Room Service", "Other"],
      required: true,
    }, // Category of service requested
    requestDetails: { type: String, default: "" }, // Free-text description of the request
    status: {
      type: String,
      enum: ["pending", "assigned", "completed", "cancelled"],
      default: "pending",
    }, // Current status of the service request
    requestedAt: { type: Date, default: Date.now }, // Timestamp when the request was made
    completedAt: { type: Date }, // Timestamp when the request was completed
    delayMinutes: { type: Number, default: 0 }, // Minutes the response was delayed
  },
  { timestamps: true }
);

const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);

export default ServiceRequest;
