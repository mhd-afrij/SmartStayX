import Hotel from "../models/Hotel.js";

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
const resolveScopeHotel = async (user) => {
  if (user.assignedHotel) return user.assignedHotel;
  if (user.role === "hotel_manager") {
    const owned = await Hotel.findOne({ owner: user._id }).select("_id").lean();
    if (owned) return owned._id;
  }
  return null;
};

export const requireHotelScope = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });

  // Super admins have global access
  if (req.user.role === "super_admin") return next();

  // Extract hotelId from query, body, or params (in that priority order)
  const hotelId = req.query.hotelId || req.query.hotel || req.body.hotelId || req.body.hotel || req.params.hotelId;

  const scopeHotelId = await resolveScopeHotel(req.user);

  if (!hotelId) {
    // If no hotelId is provided, scope to the user's hotel
    if (!scopeHotelId) {
      return res.status(403).json({ success: false, message: "No hotel assigned to your account" });
    }
    // Inject the assigned hotel so downstream handlers use the correct scope
    req.scopeHotelId = scopeHotelId;
    return next();
  }

  // Verify the requested hotelId matches the user's hotel
  if (String(hotelId) !== String(scopeHotelId)) {
    return res.status(403).json({ success: false, message: "Access denied: hotel scope violation" });
  }

  req.scopeHotelId = scopeHotelId;
  return next();
};

// Legacy aliases for backward compatibility during migration
export const requireOwner = requireHotelManager;
export const requireStaff = requireReceptionist;
