// SecurityEvent.js — Security / login activity tracker for the admin Security
// Center: logins, failed logins, session changes, and suspicious activity.
import mongoose from "mongoose";

const securityEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["login", "logout", "failed_login", "session_revoked", "suspicious", "role_change", "password_change"],
      required: true,
    },
    user: { type: String, ref: "User", required: true },
    email: { type: String, default: "" },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    device: { type: String, default: null }, // parsed device type (desktop/mobile/tablet)
    location: { type: String, default: null }, // best-effort geo hint (city/country)
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    suspicious: { type: Boolean, default: false },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
  },
  { timestamps: true }
);

securityEventSchema.index({ user: 1, createdAt: -1 });
securityEventSchema.index({ type: 1, createdAt: -1 });
securityEventSchema.index({ suspicious: 1, createdAt: -1 });
securityEventSchema.index({ ip: 1, createdAt: -1 });

const SecurityEvent = mongoose.model("SecurityEvent", securityEventSchema);
export default SecurityEvent;