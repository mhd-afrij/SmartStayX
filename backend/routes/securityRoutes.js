// securityRoutes.js — Super Admin Security Center routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireSuperAdmin } from "../middleware/authorization.js";
import {
  getSecurityOverview,
  getLoginHistory,
  getFailedLogins,
  getActiveSessions,
  revokeSession,
  getSuspiciousActivity,
} from "../controllers/securityController.js";

const securityRouter = express.Router();

// Super Admin only
securityRouter.use(protect, requireSuperAdmin);

securityRouter.get("/overview", getSecurityOverview);
securityRouter.get("/login-history", getLoginHistory);
securityRouter.get("/failed-logins", getFailedLogins);
securityRouter.get("/sessions", getActiveSessions);
securityRouter.post("/sessions/:userId/revoke", revokeSession);
securityRouter.get("/suspicious", getSuspiciousActivity);

export default securityRouter;