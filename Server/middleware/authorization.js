// authorization.js — Reusable role-based authorization middleware

// requireRole — Returns middleware that only allows specific roles through.
// Pass one or more role strings, e.g. requireRole('admin', 'hotelOwner')
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

// requireAdmin — Convenience middleware for super-admin access only.
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
