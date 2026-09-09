// PlatformSettings.js — Singleton platform configuration document.
// Holds retention policy, loyalty defaults, inventory alert config, and
// commission settings. Loaded/cached via getSettings().upsertDefaults().
import mongoose from "mongoose";
import { LOYALTY_DEFAULT_TIERS } from "../configs/loyaltyDefaults.js";

const platformSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "platform" },
    platformName: { type: String, default: "SmartStayX" },
    maintenanceMode: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    currency: { type: String, default: "USD" },

    // ── Audit log retention ────────────────────────────────────────────
    auditLog: {
      retentionDays: { type: Number, default: 365 }, // default: 1 year
      // Critical events are always retained (archived) beyond the window.
      archiveCritical: { type: Boolean, default: true },
      criticalModules: {
        type: [String],
        default: ["security", "role", "permission", "payment", "booking", "user", "hotel"],
      },
      lastArchivedAt: { type: Date, default: null },
    },

    // ── Loyalty global defaults (hotel override via LoyaltyProgram) ─────
    loyalty: {
      enabled: { type: Boolean, default: true },
      tiers: {
        type: [
          {
            _id: false,
            name: { type: String, required: true },
            threshold: { type: Number, required: true, min: 0 },
            discountPercent: { type: Number, default: 0, min: 0, max: 100 },
          },
        ],
        default: LOYALTY_DEFAULT_TIERS,
      },
      pointsPerDollar: { type: Number, default: 1, min: 0 },
      pointsPerNight: { type: Number, default: 100, min: 0 },
      reviewPoints: { type: Number, default: 50, min: 0 },
      referralPoints: { type: Number, default: 200, min: 0 },
    },

    // ── Inventory low-stock alerts ──────────────────────────────────────
    inventory: {
      emailAlertsEnabled: { type: Boolean, default: false },
      recipients: { type: [String], default: [] },
      defaultLowStockThresholdPercent: { type: Number, default: 20, min: 0, max: 100 },
    },
  },
  { timestamps: true }
);

platformSettingsSchema.statics.upsertDefaults = async function () {
  const existing = await this.findOne({ _id: "platform" });
  if (!existing) {
    return this.create({ _id: "platform" });
  }
  return existing;
};

platformSettingsSchema.statics.getSettings = async function () {
  return this.findOne({ _id: "platform" }).lean() || this.upsertDefaults();
};

const PlatformSettings = mongoose.model("PlatformSettings", platformSettingsSchema);
export default PlatformSettings;