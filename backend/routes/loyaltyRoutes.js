// loyaltyRoutes.js — Guest loyalty platform routes.
// Guests reach /me + /redeem + /rewards (catalog); managers handle config and
// the members roster. Hotel scope is enforced for staff; guests may view their
// own membership for any hotel they specify.
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole, resolveManagerScope } from "../middleware/authorization.js";
import {
  getLoyaltyConfig,
  upsertLoyaltyProgram,
  resetLoyaltyProgram,
  getMyMembership,
  getGuestProfile,
  listMembers,
  awardPoints,
  redeemReward,
  listRewards,
  createReward,
  updateReward,
  deleteReward,
} from "../controllers/loyaltyController.js";

const loyaltyRouter = express.Router();

// Enforces hotel scope for staff; guests pass through to their own loyalty.
const resolveLoyaltyScope = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
  if (req.user.role === "guest") return next();

  const scopeHotelId = await resolveManagerScope(req.user);
  const hotelId = req.query.hotelId || req.body.hotelId || req.params.hotelId;
  if (scopeHotelId && hotelId && String(hotelId) !== String(scopeHotelId)) {
    return res.status(403).json({ success: false, message: "Access denied: hotel scope violation" });
  }
  req.scopeHotelId = scopeHotelId || hotelId || null;
  return next();
};

// Guests and hotel staff (hotel-scoped)
const guestGuard = [requireRole("hotel_manager", "receptionist", "super_admin", "guest"), resolveLoyaltyScope];
// Manager-only
const managerGuard = [requireRole("hotel_manager", "receptionist", "super_admin"), resolveLoyaltyScope];

loyaltyRouter.get("/config", protect, ...managerGuard, getLoyaltyConfig);
loyaltyRouter.put("/program", protect, ...managerGuard, upsertLoyaltyProgram);
loyaltyRouter.post("/program/reset", protect, ...managerGuard, resetLoyaltyProgram);

loyaltyRouter.get("/me", protect, ...guestGuard, getMyMembership);
loyaltyRouter.get("/profile/:userId", protect, ...managerGuard, getGuestProfile);
loyaltyRouter.get("/members", protect, ...managerGuard, listMembers);

loyaltyRouter.post("/points/earn", protect, ...managerGuard, awardPoints);
loyaltyRouter.post("/redeem", protect, ...guestGuard, redeemReward);

loyaltyRouter.get("/rewards", protect, ...guestGuard, listRewards);
loyaltyRouter.post("/rewards", protect, ...managerGuard, createReward);
loyaltyRouter.patch("/rewards/:id", protect, ...managerGuard, updateReward);
loyaltyRouter.delete("/rewards/:id", protect, ...managerGuard, deleteReward);

export default loyaltyRouter;