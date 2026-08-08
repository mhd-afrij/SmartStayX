// itineraryRoutes.js — Trip itinerary generation and management routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getItinerary,
  upsertItineraryItem,
  deleteItineraryItem,
  clearItinerary,
  renameTrip,
  duplicateTrip,
  generateItinerary,
} from "../controllers/placesController.js";

const itineraryRouter = express.Router();

itineraryRouter.get("/", protect, getItinerary);
itineraryRouter.post("/", protect, upsertItineraryItem);
itineraryRouter.post("/generate", protect, generateItinerary);
itineraryRouter.post("/:tripId/duplicate", protect, duplicateTrip);
itineraryRouter.put("/:tripId/title", protect, renameTrip);
itineraryRouter.delete("/:tripId/items/:itemId", protect, deleteItineraryItem);
itineraryRouter.delete("/:tripId", protect, clearItinerary);

export default itineraryRouter;
