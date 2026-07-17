// Room.js — Room schema: type, pricing, amenities, images, and availability
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    orgId: { type: String, ref: "Organization", default: null },
    hotelName: { type: String, default: "" },
    hotelAddress: { type: String, default: "" },
    hotelCity: { type: String, default: "" },
    roomNumber: { type: String, required: true, unique: true },
    roomType: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    amenities: { type: Array, required: true }, // List of amenities available in the room
    images: [{ type: String }], // Array of image URLs for the room
    isAvailable: { type: Boolean, default: true }, // Whether the room is available for booking
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
