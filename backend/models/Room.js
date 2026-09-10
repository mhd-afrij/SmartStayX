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
    inventoryCount: { type: Number, default: 1, min: 1 }, // Number of physical rooms of this type
    pricePerNight: { type: Number, required: true },
    amenities: { type: Array, required: true }, // List of amenities available in the room
    images: [{ type: String }], // Array of image URLs for the room
    isAvailable: { type: Boolean, default: true }, // Whether the room is available for booking
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning", "maintenance", "out_of_service"],
      default: "available",
    }, // Operational status shown on the receptionist Room Status Board; isAvailable is always derived from status
  },
  { timestamps: true }
);

// Canonical rule: isAvailable is derived from status (true only when the room
// is "available"). These hooks keep the boolean in sync on every write path so
// the two fields can never drift.
roomSchema.pre("save", function (next) {
  this.isAvailable = this.status === "available";
  next();
});

const syncAvailabilityFromUpdate = function (next) {
  const update = this.getUpdate();
  if (update && typeof update === "object" && !Array.isArray(update)) {
    const set = update.$set || update;
    if (set.status !== undefined) set.isAvailable = set.status === "available";
  }
  next();
};

roomSchema.pre("findOneAndUpdate", syncAvailabilityFromUpdate);
roomSchema.pre("updateOne", syncAvailabilityFromUpdate);
roomSchema.pre("updateMany", syncAvailabilityFromUpdate);

// Frequent lookup + status filtering across dashboards and the room board.
roomSchema.index({ hotel: 1, status: 1 });
roomSchema.index({ hotel: 1, isAvailable: 1 });

const Room = mongoose.model("Room", roomSchema);

export default Room;
