// tripRoutes.js — Trip Planner routes: hotel location, trip CRUD, stops, reorder.
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getHotelLocation,
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  addStop,
  updateStop,
  deleteStop,
  reorderStops,
} from "../controllers/tripController.js";

const tripRouter = express.Router();

// All trip endpoints require authentication (guests plan trips from hotels
// they booked; staff from their assigned/owned hotel).
tripRouter.get("/hotel-location", protect, getHotelLocation);
tripRouter.get("/", protect, getTrips);
tripRouter.post("/", protect, createTrip);
tripRouter.get("/:id", protect, getTrip);
tripRouter.put("/:id", protect, updateTrip);
tripRouter.delete("/:id", protect, deleteTrip);
tripRouter.post("/:id/stops", protect, addStop);
tripRouter.put("/:id/stops/:stopId", protect, updateStop);
tripRouter.delete("/:id/stops/:stopId", protect, deleteStop);
tripRouter.put("/:id/stops-reorder", protect, reorderStops);

export default tripRouter;
