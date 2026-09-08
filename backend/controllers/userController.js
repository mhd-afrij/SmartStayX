// userController.js — User profile, search history, preferences, and team management
import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Booking from "../models/Booking.js";
import AuditLog from "../models/AuditLog.js";
import { resolveDashboardAccess, isAdminEmail } from "../configs/adminAccess.js";

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
      assignedHotel: req.user.assignedHotel || null,
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

    const safeList = (value) => {
      if (!Array.isArray(value)) return [];
      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 12);
    };

    if (name) user.name = String(name).trim();
    if (email) {
      const newEmail = String(email).trim();
      if (isAdminEmail(newEmail) && !isAdminEmail(user.email)) {
        return res.json({
          success: false,
          message: "This email address cannot be used for your profile.",
        });
      }
      user.email = newEmail;
    }

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

// Search users by email
export const searchUsers = async (req, res) => {
  try {
    if (!["super_admin", "hotel_manager", "receptionist"].includes(req.user.role)) {
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

// Assign a role to a user
export const assignRole = async (req, res) => {
  try {
    if (!["super_admin", "hotel_manager"].includes(req.user.role)) {
      return res.json({ success: false, message: "Unauthorized. Only super admins or hotel managers can assign roles." });
    }
    const { userId, role, assignedHotel } = req.body;
    if (!userId || !role) {
      return res.json({ success: false, message: "userId and role are required" });
    }
    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.json({ success: false, message: `Role "${role}" does not exist. Create it first in Role Management.` });
    }

    // Hotel managers can only assign roles within their hotel scope
    if (req.user.role === "hotel_manager" && ["super_admin"].includes(role)) {
      return res.json({ success: false, message: "Hotel managers cannot assign super_admin roles." });
    }

    let user = await User.findById(userId).select("_id name email username role");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    try {
      const metadata = { role };
      if (assignedHotel) metadata.hotelId = assignedHotel;
      await clerkClient.users.updateUserMetadata(userId, { publicMetadata: metadata });
    } catch (clerkError) {
      return res.json({ success: false, message: `Failed to update role in Clerk: ${clerkError.message}` });
    }
    const updates = { role };
    if (assignedHotel) updates.assignedHotel = assignedHotel;
    user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select("_id name email username role status assignedHotel");
    await AuditLog.create({
      actor: req.user._id,
      action: "assign_role",
      module: "user",
      recordId: userId,
      newValue: updates,
      ip: req.ip,
    });
    res.json({ success: true, message: `Role updated to ${role}`, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// List the team (all non-guest users)
const isTeamManager = (user) => ["super_admin", "hotel_manager"].includes(user?.role);

export const getTeam = async (req, res) => {
  try {
    if (!isTeamManager(req.user)) {
      return res.json({ success: false, message: "Unauthorized. Only super admins or hotel managers can manage staff." });
    }
    const { page = 1, limit = 50, role, search } = req.query;
    const query = { role: { $ne: "guest" } };

    // Hotel managers can only see their hotel's staff
    if (req.user.role === "hotel_manager" && req.user.assignedHotel) {
      query.assignedHotel = req.user.assignedHotel;
    }

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(query)
        .select("_id name email username image role status assignedHotel createdAt")
        .populate("assignedHotel", "name city")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);
    res.json({
      success: true,
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Recent staff activity derived from booking status changes
export const getTeamActivity = async (req, res) => {
  try {
    if (!isTeamManager(req.user)) {
      return res.json({ success: false, message: "Unauthorized. Only super admins or hotel managers can view staff activity." });
    }
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const matchQuery = { "statusHistory.actor": { $ne: null } };

    // Hotel managers: only their hotel's activity
    if (req.user.role === "hotel_manager" && req.user.assignedHotel) {
      matchQuery.hotel = req.user.assignedHotel;
    }

    const bookings = await Booking.find(matchQuery)
      .sort({ updatedAt: -1 })
      .limit(100)
      .populate("hotel", "name")
      .lean();

    const activity = [];
    bookings.forEach((b) => {
      (b.statusHistory || []).forEach((h) => {
        if (!h.actor) return;
        activity.push({
          type: "booking",
          actor: String(h.actor),
          action: `Updated booking to ${h.to}`,
          detail: [b.hotel?.name, b.guestDisplayName].filter(Boolean).join(" · "),
          at: h.at || b.updatedAt,
        });
      });
    });

    const actorIds = [...new Set(activity.map((a) => a.actor))];
    const users = await User.find({ _id: { $in: actorIds } })
      .select("_id name email image role")
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const staffActivity = activity
      .map((a) => {
        const u = userMap.get(a.actor);
        if (!u || u.role === "guest") return null;
        return {
          ...a,
          actorName: u.name || u.email || "Team member",
          actorRole: u.role,
          actorImage: u.image || "",
        };
      })
      .filter(Boolean)
      .sort((x, y) => new Date(y.at) - new Date(x.at))
      .slice(0, limit);

    res.json({ success: true, activity: staffActivity });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (!["super_admin"].includes(req.user.role)) {
      return res.json({ success: false, message: "Unauthorized. Only super admins can delete users." });
    }
    const { id } = req.params;
    if (!id) {
      return res.json({ success: false, message: "User ID is required" });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    await AuditLog.create({
      actor: req.user._id,
      action: "delete_user",
      module: "user",
      recordId: id,
      newValue: { email: user.email, role: user.role },
      ip: req.ip,
    });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
