import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true, default: () => crypto.randomUUID() },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    // No longer set locally — auth is fully delegated to Clerk. Kept (optional)
    // instead of removed so any legacy documents/data paths that still read it don't break.
    passwordHash: { type: String, required: false, select: false },
    role: { type: String, enum: ["guest", "staff", "owner", "admin"], default: "guest" },
    status: { type: String, enum: ["active", "suspended", "pending"], default: "active" },
    image: { type: String, default: "" },
    orgIds: [{ type: String, ref: "Organization" }],
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
