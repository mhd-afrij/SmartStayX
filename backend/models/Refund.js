// Refund.js — Refund schema: tracks refund requests, Stripe processing, and status
import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    user: { type: String, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "usd" },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "processed", "failed"],
      default: "requested",
    },
    stripeRefundId: { type: String, default: null },
    stripePaymentIntentId: { type: String, default: null },
    processedAt: { type: Date },
    decisionNote: { type: String, default: "" },
    processedBy: { type: String, ref: "User", default: null },
  },
  { timestamps: true }
);

refundSchema.index({ booking: 1, status: 1 });
refundSchema.index({ user: 1, createdAt: -1 });

const Refund = mongoose.model("Refund", refundSchema);
export default Refund;
