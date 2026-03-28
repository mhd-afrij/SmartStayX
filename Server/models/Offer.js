import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    discountPercent: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    image: { type: String },
    room: { type: String, ref: "Room", required: true },
    hotel: { type: String, ref: "Hotel", required: true },
    owner: { type: String, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
