// analyticsRoutes.js — Trend analysis and tourist analytics routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole, requireHotelScope } from "../middleware/authorization.js";
import validateRequest from "../middleware/validateRequest.js";
import analyticsValidators from "../validators/analyticsValidators.js";
import {
  getBookingTrends,
  getPopularDestinations,
  getRevenueAnalytics,
  getGuestDemographics,
} from "../controllers/analyticsController.js";

const analyticsRouter = express.Router();

// Platform/analytics data is restricted to super admins (global) and hotel
// managers (scoped to their assigned hotel). Guests and receptionists are
// excluded. A hotel manager is always scoped via requireHotelScope.
const analyticsGuard = [requireRole("super_admin", "hotel_manager"), requireHotelScope];

analyticsRouter.get("/booking-trends", protect, ...analyticsGuard, validateRequest({ query: analyticsValidators.analyticsQuery }), getBookingTrends);
analyticsRouter.get("/popular-destinations", protect, ...analyticsGuard, validateRequest({ query: analyticsValidators.destinationQuery }), getPopularDestinations);
analyticsRouter.get("/revenue", protect, ...analyticsGuard, validateRequest({ query: analyticsValidators.analyticsQuery }), getRevenueAnalytics);
analyticsRouter.get("/demographics", protect, ...analyticsGuard, validateRequest({ query: analyticsValidators.analyticsQuery }), getGuestDemographics);

export default analyticsRouter;
