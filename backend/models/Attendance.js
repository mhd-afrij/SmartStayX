// Attendance.js — Staff attendance record. Time-based check-in/check-out.
// Geo fields are optional so GPS/geofencing can be added later without
// restructuring the module.
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    staff: { type: String, ref: "User", required: true }, // Clerk user ID
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    date: { type: Date, required: true },
    shiftStart: { type: Date, default: null }, // configured shift window
    shiftEnd: { type: Date, default: null },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    status: {
      type: String,
      enum: ["present", "late", "absent", "leave", "half_day"],
      default: "present",
    },
    lateMinutes: { type: Number, default: 0, min: 0 },
    // ── Optional GPS for future geofencing (not used for auth yet) ──────
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined,
      },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
      accuracy: { type: Number, default: null },
    },
    checkInGeofenceVerified: { type: Boolean, default: false },
    checkOutGeofenceVerified: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    source: { type: String, enum: ["manual", "device"], default: "manual" },
  },
  { timestamps: true }
);

attendanceSchema.index({ hotel: 1, staff: 1, date: 1 }, { unique: true });
attendanceSchema.index({ hotel: 1, date: 1 });
attendanceSchema.index({ staff: 1, date: -1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;