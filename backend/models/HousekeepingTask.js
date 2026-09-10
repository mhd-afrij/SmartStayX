// HousekeepingTask.js — Room cleaning workflow: Dirty → Assigned → In-progress
// → Inspection → Ready
import mongoose from "mongoose";

const housekeepingTaskSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    roomNumber: { type: String, default: "" },
    assignedTo: { type: String, ref: "User", default: null }, // cleaner Clerk ID
    assignedBy: { type: String, ref: "User", default: null },
    status: {
      type: String,
      enum: ["dirty", "assigned", "in_progress", "inspection", "ready"],
      default: "dirty",
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    checklist: [
      {
        _id: false,
        label: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    scheduledFor: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    inspectedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
    createdBy: { type: String, ref: "User", default: null },
  },
  { timestamps: true }
);

housekeepingTaskSchema.index({ hotel: 1, status: 1, createdAt: -1 });
housekeepingTaskSchema.index({ room: 1 });
housekeepingTaskSchema.index({ assignedTo: 1, status: 1 });

const HousekeepingTask = mongoose.model("HousekeepingTask", housekeepingTaskSchema);
export default HousekeepingTask;