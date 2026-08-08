// MaintenanceReport.js — Maintenance report schema: issue, priority, status, and assignment
import mongoose from "mongoose";

const maintenanceReportSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    roomNumber: { type: String, default: "" },
    issue: { type: String, required: true },
    description: { type: String, default: "" },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "rejected"],
      default: "open",
    },
    reporter: { type: String, ref: "User", default: null }, // Clerk user ID who reported
    assignedTo: { type: String, ref: "User", default: null }, // Clerk user ID assigned
    notes: [{ type: String }],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

maintenanceReportSchema.index({ hotel: 1, status: 1, createdAt: -1 });
maintenanceReportSchema.index({ room: 1 });

const MaintenanceReport = mongoose.model("MaintenanceReport", maintenanceReportSchema);
export default MaintenanceReport;
