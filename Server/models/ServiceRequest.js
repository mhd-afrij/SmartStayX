import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    guest: { type: String, ref: "User", required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    serviceType: { 
        type: String, 
        enum: ["Housekeeping", "Maintenance", "Room Service", "Other"], 
        required: true 
    },
    requestDetails: { type: String },
    status: { 
        type: String, 
        enum: ["pending", "assigned", "completed", "cancelled"], 
        default: "pending" 
    },
    staffAssigned: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    delayMinutes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);
export default ServiceRequest;
