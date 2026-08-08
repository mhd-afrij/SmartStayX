import { getAuth } from "@clerk/express";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import logger from "../utils/logger.js";

export const protect = async (req, res, next) => {
  try {
    const { userId, sessionClaims } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const clerkRole = sessionClaims?.publicMetadata?.role || sessionClaims?.public_metadata?.role || null;

    let user = await User.findById(userId);
    if (!user) {
      const email = sessionClaims?.email || sessionClaims?.emailAddress || `${userId}@placeholder.local`;
      const name = sessionClaims?.name || sessionClaims?.firstName || "Guest";
      user = await User.create({
        _id: userId,
        name,
        username: userId,
        email,
        role: clerkRole || "guest",
        status: "active",
      });
    } else if (clerkRole && user.role !== clerkRole) {
      user.role = clerkRole;
      await user.save();
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
