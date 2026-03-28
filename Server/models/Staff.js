import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    name: { type: String, required: true },
    role: { 
        type: String, 
        enum: ["Housekeeping", "Maintenance", "Room Service", "Front Desk"], 
        required: true 
    },
    isAvailable: { type: Boolean, default: true },
    assignedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "ServiceRequest" }]
  },
  { timestamps: true }
);

const Staff = mongoose.model("Staff", staffSchema);
export default Staff;
