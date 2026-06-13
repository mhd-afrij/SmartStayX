// Hotel.js — Hotel schema: details, location, images, and owner reference
import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    owner: { type: String, required: true, ref: "User" },
    city: { type: String, required: true },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    currency: { type: String, default: "USD" },
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
