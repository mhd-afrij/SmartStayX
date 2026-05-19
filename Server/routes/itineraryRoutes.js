import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getItinerary, upsertItineraryItem } from "../controllers/placesController.js";

const itineraryRouter = express.Router();

itineraryRouter.get("/", protect, getItinerary);
itineraryRouter.post("/", protect, upsertItineraryItem);

export default itineraryRouter;
