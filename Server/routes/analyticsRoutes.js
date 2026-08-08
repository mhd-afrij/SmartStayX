// analyticsRoutes.js — Trend analysis and tourist analytics routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import analyticsValidators from "../validators/analyticsValidators.js";
import {
  getBookingTrends,
  getPopularDestinations,
  getRevenueAnalytics,
  getGuestDemographics,
} from "../controllers/analyticsController.js";

const analyticsRouter = express.Router();

analyticsRouter.get("/booking-trends", protect, validateRequest({ query: analyticsValidators.analyticsQuery }), getBookingTrends);
analyticsRouter.get("/popular-destinations", protect, validateRequest({ query: analyticsValidators.destinationQuery }), getPopularDestinations);
analyticsRouter.get("/revenue", protect, validateRequest({ query: analyticsValidators.analyticsQuery }), getRevenueAnalytics);
analyticsRouter.get("/demographics", protect, validateRequest({ query: analyticsValidators.analyticsQuery }), getGuestDemographics);

export default analyticsRouter;
