import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { isAdminEmail, normalizeRole } from "../configs/adminAccess.js";
import logger from "../utils/logger.js";

export const protect = async (req, res, next) => {
  try {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const clerkRole = sessionClaims?.publicMetadata?.role || sessionClaims?.public_metadata?.role || null;
    const clerkHotelId = sessionClaims?.publicMetadata?.hotelId || sessionClaims?.public_metadata?.hotelId || null;

    let user = await User.findById(userId);

    // Derive email from the session token first, then fall back to the stored
    // user doc (Clerk JWTs don't always carry the email claim). This keeps the
    // ADMIN_EMAILS match reliable for existing users.
    const email =
      sessionClaims?.email ||
      sessionClaims?.emailAddress ||
      user?.email ||
      `${userId}@placeholder.local`;
    const name = sessionClaims?.name || sessionClaims?.firstName || user?.name || "Guest";

    // Configured admin emails ALWAYS resolve to the "super_admin" role, overriding any
    // stale Clerk public metadata (e.g. the legacy "hotelOwner" or "admin" role).
    const effectiveRole = isAdminEmail(email) ? "super_admin" : normalizeRole(clerkRole);

    if (!user) {
      user = await User.create({
        _id: userId,
        name,
        username: userId,
        email,
        role: effectiveRole,
        status: "active",
        assignedHotel: clerkHotelId || null,
      });
    } else {
      let changed = false;
      if (user.role !== effectiveRole) {
        user.role = effectiveRole;
        changed = true;
      }
      // Sync assignedHotel from Clerk metadata for hotel_manager / receptionist
      if (
        (effectiveRole === "hotel_manager" || effectiveRole === "receptionist") &&
        clerkHotelId &&
        String(user.assignedHotel) !== String(clerkHotelId)
      ) {
        user.assignedHotel = clerkHotelId;
        changed = true;
      }
      // Repair legacy docs that predate the status field so they aren't 401'd.
      if (!user.status) {
        user.status = "active";
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    if (!user || user.status !== "active") {
      return res.status(401).json({ success: false, message: "User not found or inactive" });
    }
    req.user = user;

    const orgId = req.headers["x-org-id"] || null;
    const orgRole = req.headers["x-org-role"] || null;
    if (orgId) {
      const org = await Organization.findById(orgId);
      if (org) {
        req.org = org;
        req.orgId = org._id;
        req.orgRole = orgRole;
        req.orgSlug = org.slug;
      }
    }
    next();
  } catch (error) {
    logger.error("Authentication failed: %s", error.message);
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
};
