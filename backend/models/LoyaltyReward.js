// LoyaltyReward.js — Rewards catalog that guests can redeem points for.
import mongoose from "mongoose";

const loyaltyRewardSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    pointsCost: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      enum: ["discount", "upgrade", "free_night", "offer", "voucher", "gift"],
      default: "discount",
    },
    value: { type: Number, default: 0 }, // discount % or monetary value
    quantityAvailable: { type: Number, default: null, min: 0 }, // null = unlimited
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    createdBy: { type: String, ref: "User", default: null },
  },
  { timestamps: true }
);

loyaltyRewardSchema.index({ hotel: 1, isActive: 1 });

const LoyaltyReward = mongoose.model("LoyaltyReward", loyaltyRewardSchema);
export default LoyaltyReward;