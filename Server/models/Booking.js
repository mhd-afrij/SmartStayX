import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
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
      enum: ["pending", "confirmed", "cancelled", "expired"],
      default: "pending",
    },
    holdExpiresAt: { type: Date },
    idempotencyKey: { type: String, index: true },
    paymentMethod: { type: String, required: true, default: "Pay At Hotel" },
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
