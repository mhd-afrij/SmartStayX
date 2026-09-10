import Hotel from "../models/Hotel.js";
import Booking from "../models/Booking.js";

// Resolves the single hotel a non-super-admin user is scoped to:
// preferred `assignedHotel`, else the hotel(s) a hotel_manager owns/registered.
// For receptionists, falls back to the most recent booking's hotel.
// Returns null for super_admins (global access).
export const resolveManagerScope = async (user) => {
  if (user?.role === "super_admin") return null;
  if (user?.assignedHotel) return String(user.assignedHotel);
  if (user?.role === "hotel_manager") {
    const owned = await Hotel.findOne({ owner: user._id }).select("_id").lean();
    if (owned) return String(owned._id);
  }
  // Fallback for receptionist: find hotel from their most recent booking
  if (user?.role === "receptionist") {
    const latestBooking = await Booking.findOne({ user: String(user._id) })
      .select("hotel")
      .sort({ createdAt: -1 })
      .lean();
    if (latestBooking?.hotel) return String(latestBooking.hotel);
  }
  return null;
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: `Access denied. Required role: ${allowedRoles.join(" or ")}` });
      }
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
  if (req.user.role !== "super_admin") return res.status(403).json({ success: false, message: "Super Admin access required" });
  return next();
};

export const requireHotelManager = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
  if (!["hotel_manager", "super_admin"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Hotel Manager access required" });
  }
  return next();
};

export const requireReceptionist = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
  if (!["receptionist", "hotel_manager", "super_admin"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Receptionist access required" });
  }
  return next();
};

// Ensures the requesting user's assignedHotel matches the hotel being accessed.
// super_admin users bypass this check (global access).
// hotel_manager and receptionist must have an assignedHotel that matches.
// Resolves the effective hotel scope for a non-super-admin user.
// Prefers `assignedHotel`, but hotel managers who registered their property
// before hotelId was synced to Clerk metadata fall back to their owned hotels.
// Receptionists fall back to their most recent booking's hotel.
const resolveScopeHotel = async (user) => resolveManagerScope(user);

export const requireHotelScope = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });

    // Super admins have global access
    if (req.user.role === "super_admin") return next();

    // Extract hotelId from query, body, or params (in that priority order)
    const hotelId = req.query?.hotelId || req.query?.hotel || req.body?.hotelId || req.body?.hotel || req.params?.hotelId;

    const scopeHotelId = await resolveScopeHotel(req.user);

    if (!hotelId) {
      // If no hotelId is provided, scope to the user's hotel
      if (!scopeHotelId) {
        return res.status(403).json({ success: false, message: "No hotel assigned to your account. Please contact your manager." });
      }
      // Inject the assigned hotel so downstream handlers use the correct scope
      req.scopeHotelId = scopeHotelId;
      return next();
    }

    // Verify the requested hotelId matches the user's hotel
    if (!scopeHotelId || String(hotelId) !== String(scopeHotelId)) {
      return res.status(403).json({ success: false, message: "Access denied: hotel scope violation" });
    }

    req.scopeHotelId = scopeHotelId;
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to resolve hotel scope" });
  }
};

// Legacy aliases for backward compatibility during migration
export const requireOwner = requireHotelManager;
export const requireStaff = requireReceptionist;

// ---------------------------------------------------------------------------
// Permission-based RBAC
// ---------------------------------------------------------------------------
// Gate a route by permission string(s) derived from the user's role + role doc.
// Fallback permission maps keep legacy/seed roles functional.
const ROLE_PERMISSIONS = {
  super_admin: "*",
  hotel_manager: [
    "manage_hotels",
    "manage_rooms",
    "manage_bookings",
    "manage_staff",
    "manage_payments",
    "manage_pricing",
    "manage_offers",
    "manage_reviews",
    "manage_testimonials",
    "manage_services",
    "manage_destinations",
    "view_analytics",
  ],
  receptionist: ["checkin", "checkout", "view_reservations", "manage_rooms", "manage_services"],
  guest: [],
};

export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      if (req.user.role === "super_admin") return next();

      const allowed = ROLE_PERMISSIONS[req.user.role] || [];
      if (allowed === "*") return next();
      const hasAll = permissions.every((p) => allowed.includes(p));
      if (!hasAll) {
        return res
          .status(403)
          .json({ success: false, message: `Access denied. Required permission: ${permissions.join(" or ")}` });
      }
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};

// Verifies that a hotelId present in body/query/params is within the acting
// user's scope. Adds req.scopeHotelId when resolved. super_admin bypasses.
export const requireHotelAccess = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
  if (req.user.role === "super_admin") return next();

  const hotelId =
    req.body?.hotelId || req.body?.hotel || req.query?.hotelId || req.params?.hotelId || null;
  const scopeHotelId = await resolveManagerScope(req.user);

  if (!hotelId) {
    req.scopeHotelId = scopeHotelId;
    return next();
  }
  if (!scopeHotelId || String(hotelId) !== String(scopeHotelId)) {
    return res.status(403).json({ success: false, message: "Access denied: hotel scope violation" });
  }
  req.scopeHotelId = scopeHotelId;
  return next();
};
