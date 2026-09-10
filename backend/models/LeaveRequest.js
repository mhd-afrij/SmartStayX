// LeaveRequest.js — Staff leave request workflow
import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    staff: { type: String, ref: "User", required: true }, // Clerk user ID
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    type: {
      type: String,
      enum: ["annual", "sick", "unpaid", "casual", "other"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 0.5 },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    approvedBy: { type: String, ref: "User", default: null },
    responseNote: { type: String, default: "" },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ hotel: 1, status: 1, createdAt: -1 });
leaveRequestSchema.index({ staff: 1, startDate: -1 });

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
export default LeaveRequest;