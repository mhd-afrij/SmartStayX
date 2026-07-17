// pricingMLRoutes.js — Enhanced ML-driven pricing suggestion routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getEnhancedSuggestions } from "../controllers/pricingMLController.js";

const pricingMLRouter = express.Router();

pricingMLRouter.get("/enhanced", protect, getEnhancedSuggestions);

export default pricingMLRouter;
