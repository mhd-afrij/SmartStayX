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

export const requireOwner = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
  if (req.user.role !== "owner") return res.status(403).json({ success: false, message: "Owner access required" });
  return next();
};

export const requireStaff = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
  if (!["staff", "owner"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Staff access required" });
  return next();
};
