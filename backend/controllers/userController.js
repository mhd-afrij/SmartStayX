// userController.js — User profile, search history, and preferences
import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import Role from "../models/Role.js";
import { resolveDashboardAccess } from "../configs/adminAccess.js";

// Get authenticated user's role, profile, recent searches, and basic info
export const getUserData = async (req, res) => {
  try {
    const dashboardAccess = await resolveDashboardAccess(req.user, req.orgRole);
    const recentSearchedCities = req.user.recentSearchedCities;
    const profile = req.user.profile || {
      phone: "",
      dateOfBirth: "",
      country: "",
      preferredLanguage: "en",
      preferredCurrency: "USD",
      preferences: {
        roomType: "",
        amenities: [],
        destinations: [],
        travelPurpose: "",
        specialRequests: "",
      },
    };

    res.json({
      success: true,
      role: req.user.role,
      status: req.user.status,
      dashboardAccess,
      recentSearchedCities,
      profile,
      orgId: req.orgId || null,
      orgRole: req.orgRole || null,
      orgSlug: req.orgSlug || null,
      user: {
        id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        image: req.user.image,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Store a recently searched city (keeps last 3, FIFO)
export const storeRecentSearchedCities = async (req, res) => {
  try {
    const { recentSearchedCity } = req.body;
    const user = req.user;

    if (user.recentSearchedCities.length < 3) {
      user.recentSearchedCities.push(recentSearchedCity);
    } else {
      user.recentSearchedCities.shift();
      user.recentSearchedCities.push(recentSearchedCity);
    }

    await user.save();
    res.json({ success: true, message: "City added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update or create the guest profile with typed preferences
export const upsertGuestProfile = async (req, res) => {
  try {
    const user = req.user;
    const {
      name,
      email,
      phone,
      dateOfBirth,
      country,
      preferredLanguage,
      preferredCurrency,
      preferences = {},
    } = req.body || {};

    // Sanitize array fields: ensure array, trim strings, remove empty, limit to 12
    const safeList = (value) => {
      if (!Array.isArray(value)) return [];
      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 12);
    };

    if (name) user.name = String(name).trim();
    if (email) user.email = String(email).trim();

    user.profile = {
      phone: String(phone || "").trim(),
      dateOfBirth: String(dateOfBirth || "").trim(),
      country: String(country || "").trim(),
      preferredLanguage: String(preferredLanguage || "en").trim() || "en",
      preferredCurrency: String(preferredCurrency || "USD").trim() || "USD",
      preferences: {
        roomType: String(preferences.roomType || "").trim(),
        amenities: safeList(preferences.amenities),
        destinations: safeList(preferences.destinations),
        travelPurpose: String(preferences.travelPurpose || "").trim(),
        specialRequests: String(preferences.specialRequests || "").trim().slice(0, 500),
      },
    };

    await user.save();

    return res.json({
      success: true,
      message: "Guest profile updated",
      profile: user.profile,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Admin only: Search users by email (also fetches from Clerk API if not found locally)
export const searchUsers = async (req, res) => {
  try {
    if (!["owner", "staff"].includes(req.user.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const { email } = req.query;
    if (!email || email.length < 3) {
      return res.json({ success: false, message: "Email must be at least 3 characters" });
    }
    let users = await User.find({
      email: { $regex: email, $options: "i" },
    }).select("_id name email username role image");

    res.json({ success: true, users });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Admin only: Assign a role to a user (also fetches from Clerk API if not found locally)
export const assignRole = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized. Only hotel owners or admins can assign roles." });
    }
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.json({ success: false, message: "userId and role are required" });
    }
    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.json({ success: false, message: `Role "${role}" does not exist. Create it first in Role Management.` });
    }
    let user = await User.findById(userId).select("_id name email username role");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    try {
      await clerkClient.users.updateUserMetadata(userId, { publicMetadata: { role } });
    } catch (clerkError) {
      return res.json({ success: false, message: `Failed to update role in Clerk: ${clerkError.message}` });
    }
    user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("_id name email username role status");
    res.json({ success: true, message: `Role updated to ${role}`, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.json({ success: false, message: "Unauthorized. Only hotel owners or admins can delete users." });
    }
    const { id } = req.params;
    if (!id) {
      return res.json({ success: false, message: "User ID is required" });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
