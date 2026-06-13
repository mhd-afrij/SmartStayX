// User.js — User schema: profile, auth, preferences, and search history
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // Clerk user ID
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String, required: true },
    role: { type: String, enum: ["user", "hotelOwner"], default: "user" },
    recentSearchedCities: [{ type: String }],
    profile: {
      phone: { type: String, default: "" },
      dateOfBirth: { type: String, default: "" },
      country: { type: String, default: "" },
      preferredLanguage: { type: String, default: "en" },
      preferredCurrency: { type: String, default: "USD" },
      preferences: {
        roomType: { type: String, default: "" },
        amenities: [{ type: String }],
        destinations: [{ type: String }],
        travelPurpose: { type: String, default: "" },
        specialRequests: { type: String, default: "" },
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
