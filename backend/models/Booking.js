// Booking.js — Booking schema: dates, pricing, payment, status, and guest info
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    orgId: { type: String, ref: "Organization", default: null },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    nights: { type: Number, min: 1 },
    basePricePerNight: { type: Number, min: 0 },
    dynamicPricePerNight: { type: Number, min: 0 },
    priceMultiplier: { type: Number, min: 1 },
    guestDisplayName: { type: String, default: "Guest" },
    guestEmail: { type: String, default: "" },
    totalPrice: { type: Number, required: true },
    guests: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "expired", "reservation"],
      default: "pending",
    },
    statusHistory: [
      {
        from: { type: String },
        to: { type: String },
        at: { type: Date, default: Date.now },
        actor: { type: String, default: null },
        reason: { type: String, default: null },
      },
    ],
    holdExpiresAt: { type: Date },
    idempotencyKey: { type: String, index: true },
    paymentMethod: { type: String, required: true, default: "Pay At Hotel" },
    isPaid: { type: Boolean, default: false },
    stripePaymentIntentId: { type: String, default: null },
    stripeSessionId: { type: String, default: null },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: "Offer" },
    offerDiscountPercent: { type: Number, min: 0, max: 100 },
    originalPricePerNight: { type: Number, min: 0 },
    // ── Workflow tracking (NOT status values) ───────────────────────────
    // The core `status` enum above remains the single authoritative state;
    // these fields + statusHistory capture the surrounding workflow events.
    paymentPendingAt: { type: Date, default: null },   // booking awaiting payment
    paymentReceivedAt: { type: Date, default: null },  // payment captured
    roomAssignedAt: { type: Date, default: null },     // room assigned to booking
    invoiceGeneratedAt: { type: Date, default: null }, // invoice physically generated
    reviewRequestedAt: { type: Date, default: null },  // post-stay review invited
    checkedInAt: { type: Date, default: null },        // guest checked in
    checkedOutAt: { type: Date, default: null },       // guest checked out
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
