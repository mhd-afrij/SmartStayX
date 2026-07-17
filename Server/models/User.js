// User.js — User schema: profile, auth, preferences, and search history
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // Clerk user ID
    name: { type: String, required: true }, // User's display name
    username: { type: String, required: true }, // Unique username for the user
    email: { type: String, required: true }, // User's email address
    image: { type: String, required: true }, // URL to user's profile picture
    role: { type: String, default: "user" }, // User role for authorization
    orgIds: [{ type: String, ref: "Organization" }], // Organizations the user belongs to
    recentSearchedCities: [{ type: String }], // List of recently searched city names
    profile: {
      phone: { type: String, default: "" }, // Contact phone number
      dateOfBirth: { type: String, default: "" }, // User's date of birth
      country: { type: String, default: "" }, // Country of residence
      preferredLanguage: { type: String, default: "en" }, // Preferred language code
      preferredCurrency: { type: String, default: "USD" }, // Preferred currency code
      preferences: {
        roomType: { type: String, default: "" }, // Preferred room type
        amenities: [{ type: String }], // Preferred amenities
        destinations: [{ type: String }], // Preferred travel destinations
        travelPurpose: { type: String, default: "" }, // Typical travel purpose
        specialRequests: { type: String, default: "" }, // Common special requests
      }, // User travel preferences
    }, // User profile details
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
