// tripPlannerRoutes.js — Multi-country Trip Planner API.
// All routes require authentication. Origin coordinates always come from the
// Hotel document in the database; the frontend only supplies hotelId +
// destination + travel mode.
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/authorization.js";
import {
  getTripPlannerContext,
  getTripPlannerNearby,
  getTripPlannerSearch,
  createTripPlannerRoute,
} from "../controllers/tripPlannerController.js";

const tripPlannerRouter = express.Router();

// Any authenticated role may use the concierge Trip Planner. Managers and
// receptionists are isolated to their assigned hotel inside the controller.
tripPlannerRouter.use(protect, requireRole("super_admin", "hotel_manager", "receptionist", "guest"));

tripPlannerRouter.get("/context", getTripPlannerContext);
tripPlannerRouter.get("/nearby", getTripPlannerNearby);
tripPlannerRouter.get("/search", getTripPlannerSearch);
tripPlannerRouter.post("/route", createTripPlannerRoute);

export default tripPlannerRouter;