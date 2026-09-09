// LoyaltyMembership.js — Per-guest, per-hotel loyalty membership: points
// balance, tier, lifetime stats, and a history of earn/redeem events.
import mongoose from "mongoose";

const loyaltyHistoryEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["earn", "redeem", "expire", "adjust"], required: true },
    points: { type: Number, required: true }, // signed increments
    reason: { type: String, default: "" },
    linkedRef: { type: String, default: null }, // booking id / reward id / etc.
    recordedBy: { type: String, default: null },
  },
  { timestamps: true }
);

const loyaltyMembershipSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true }, // Clerk user ID
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    points: { type: Number, required: true, default: 0, min: 0 },
    tier: { type: String, default: "Bronze" },
    totalStays: { type: Number, default: 0 },
    lifetimeSpend: { type: Number, default: 0 },
    referralsCount: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: null },
    history: { type: [loyaltyHistoryEntrySchema], default: [] },
  },
  { timestamps: true }
);

loyaltyMembershipSchema.index({ user: 1, hotel: 1 }, { unique: true });
loyaltyMembershipSchema.index({ hotel: 1, points: -1 });
loyaltyMembershipSchema.index({ hotel: 1, tier: 1 });

const LoyaltyMembership = mongoose.model("LoyaltyMembership", loyaltyMembershipSchema);
export default LoyaltyMembership;