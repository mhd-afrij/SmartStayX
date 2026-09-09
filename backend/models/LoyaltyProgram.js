// LoyaltyProgram.js — Per-hotel loyalty configuration. When a document does
// not exist for a hotel, the resolver falls back to the global defaults in
// PlatformSettings.loyalty / configs/loyaltyDefaults.js.
import mongoose from "mongoose";

const loyaltyProgramSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, unique: true },
    enabled: { type: Boolean, default: true },
    // Overrides the global tier thresholds. If absent, global defaults apply.
    tiers: {
      type: [
        {
          _id: false,
          name: { type: String, required: true },
          threshold: { type: Number, required: true, min: 0 },
          discountPercent: { type: Number, default: 0, min: 0, max: 100 },
        },
      ],
      default: undefined,
    },
    pointsPerDollar: { type: Number, default: null }, // null → use global default
    pointsPerNight: { type: Number, default: null },
    reviewPoints: { type: Number, default: null },
    referralPoints: { type: Number, default: null },
  },
  { timestamps: true }
);

const LoyaltyProgram = mongoose.model("LoyaltyProgram", loyaltyProgramSchema);
export default LoyaltyProgram;