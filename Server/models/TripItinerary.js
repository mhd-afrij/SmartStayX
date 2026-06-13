// TripItinerary.js — Trip itinerary schema: destinations, hotels, and daily plans
import mongoose from "mongoose";

const itineraryItemSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    day: { type: Number, default: 1, min: 1 },
    notes: { type: String, default: "" },
    placeId: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    photoUrl: { type: String, default: "" },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: true }
);

const tripItinerarySchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    tripId: { type: String, required: true, trim: true },
    title: { type: String, default: "My Trip Plan" },
    destination: { type: String, default: "" },
    origin: { type: String, default: "" },
    items: [itineraryItemSchema],
  },
  { timestamps: true }
);

tripItinerarySchema.index({ user: 1, tripId: 1 }, { unique: true });

const TripItinerary = mongoose.model("TripItinerary", tripItinerarySchema);

export default TripItinerary;
