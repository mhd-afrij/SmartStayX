// Hotel.js — Hotel schema: details, location, images, and owner reference
import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    owner: { type: String, required: true, ref: "User" },
    orgId: { type: String, ref: "Organization", default: null },
    city: { type: String, required: true },
    country: { type: String, default: "" },
    // ── Trip Planner: canonical hotel coordinates (optional) ──────────────
    // Used as the trip starting point. Missing values yield the
    // "Hotel location is incomplete" fallback in the Trip Planner UI.
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined,
        validate: {
          validator: (v) => v === undefined || v === null || v.length === 0 || v.length === 2,
          message: "location.coordinates must be [lng, lat]",
        },
      },
    },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    currency: { type: String, default: "USD" },
    // ── Super Admin approval workflow ───────────────────────────────────
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "approved", // legacy hotels are treated as already approved
    },
    rejectionReason: { type: String, default: "" },
    verifiedDocuments: { type: Boolean, default: false },
    documents: [
      {
        _id: false,
        type: { type: String, default: "other" },
        name: { type: String, default: "" },
        url: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // ── Inventory low-stock alert recipients (hotel/manager override) ───
    settings: {
      emailAlertsEnabled: { type: Boolean, default: false },
      alertRecipients: { type: [String], default: [] },
    },
    pricingRules: {
      weekendSurcharge: { type: Number, default: null },
      highOccupancyThreshold: { type: Number, default: null },
      highOccupancySurcharge: { type: Number, default: null },
      holdMinutes: { type: Number, default: null },
      seasonalOverrides: [{ type: Object }],
      lengthOfStayDiscounts: [{ type: Object }],
      lastMinuteDiscount: { type: Number, default: null },
      earlyBirdWindowDays: { type: Number, default: null },
      earlyBirdDiscount: { type: Number, default: null },
      repeatGuestDiscount: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;
