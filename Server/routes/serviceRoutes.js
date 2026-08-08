// serviceRoutes.js — Room service request handling routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  requestService,
  updateServiceStatus,
  getHotelServiceHistory,
} from "../controllers/serviceController.js";

const serviceRouter = express.Router();

// POST /request — Request a room service (auth required)
serviceRouter.post("/request", protect, requestService);
// POST /update-status — Update the status of a service request (auth required)
serviceRouter.post("/update-status", protect, updateServiceStatus);
// GET /history — Get service request history for the hotel (auth required)
serviceRouter.get("/history", protect, getHotelServiceHistory);

export default serviceRouter;
