// pricingRoutes.js — AI-driven dynamic pricing, occupancy, revenue forecasting,
// and ML pricing endpoints. Consolidates the legacy `/api/ml` and
// `/api/pricing/ml` routers into a single pricing router.
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole, requireHotelScope } from "../middleware/authorization.js";
import validateRequest from "../middleware/validateRequest.js";
import pricingValidators from "../validators/pricingValidators.js";
import { suggestPricing, getOccupancy, updatePrice, getRevenueForecast, getPricingSuggestions } from "../controllers/pricingController.js";
import { getEnhancedSuggestions, predictPrice } from "../controllers/pricingMLController.js";

const pricingRouter = express.Router();

// Pricing data and price mutation are restricted to hotel managers (scoped to
// their assigned hotel) and super admins. Guests cannot read or change prices.
const pricingGuard = [requireRole("hotel_manager", "super_admin"), requireHotelScope];

pricingRouter.get("/suggest", protect, ...pricingGuard, validateRequest({ query: pricingValidators.suggestPricingQuery }), suggestPricing);
pricingRouter.get("/occupancy", protect, ...pricingGuard, validateRequest({ query: pricingValidators.suggestPricingQuery }), getOccupancy);

// Price mutation is hotel-scoped: a hotel manager can never update a room
// outside their assigned hotel (enforced in updatePrice + requireHotelScope).
pricingRouter.post("/update", protect, ...pricingGuard, updatePrice);

// ── AI revenue forecasting (7/30/90 day windows) ─────────────────────────
pricingRouter.get("/forecast", protect, ...pricingGuard, getRevenueForecast);
pricingRouter.get("/suggestions", protect, ...pricingGuard, getPricingSuggestions);

// ── ML pricing (consolidated from the legacy /api/ml and /api/pricing/ml) ──
pricingRouter.get("/ml/enhanced", protect, ...pricingGuard, getEnhancedSuggestions);
pricingRouter.post("/ml/predict", protect, requireRole("hotel_manager", "super_admin"), predictPrice);

export default pricingRouter;