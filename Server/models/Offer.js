// Offer.js — Offer schema: discount, validity, eligibility, and room association
import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Offer title/headline
    description: { type: String, required: true }, // Detailed description of the offer
    discountPercent: { type: Number, required: true }, // Discount percentage to apply
    expiryDate: { type: Date, required: true }, // Date after which the offer is invalid
    image: { type: String, default: "" }, // URL to offer banner image
    room: { type: String, ref: "Room", required: true }, // Room this offer applies to
    hotel: { type: String, ref: "Hotel", required: true }, // Hotel this offer belongs to
    owner: { type: String, ref: "User", required: true }, // Clerk user ID of the offer creator
    isActive: { type: Boolean, default: true }, // Whether the offer is currently active
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
