// pricingRoutes.js — AI-driven dynamic pricing and occupancy routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import pricingValidators from "../validators/pricingValidators.js";
import { suggestPricing, getOccupancy, updatePrice } from "../controllers/pricingController.js";

const pricingRouter = express.Router();

pricingRouter.get("/suggest", protect, validateRequest({ query: pricingValidators.suggestPricingQuery }), suggestPricing);
pricingRouter.get("/occupancy", protect, validateRequest({ query: pricingValidators.suggestPricingQuery }), getOccupancy);
pricingRouter.post("/update", protect, updatePrice);

export default pricingRouter;
