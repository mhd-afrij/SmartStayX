// destinationRoutes.js — Destination CRUD routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  createDestination,
  getAllDestinations,
  getDestinationById,
  updateDestination,
  deleteDestination,
} from "../controllers/destinationController.js";

const destinationRouter = express.Router();

// POST / — Create a new destination with image upload (auth required)
destinationRouter.post("/", protect, upload.single("image"), createDestination);
// GET / — Get all destinations (public)
destinationRouter.get("/", getAllDestinations);
// GET /:id — Get a single destination by ID (public)
destinationRouter.get("/:id", getDestinationById);
// PUT /:id — Update a destination with image upload (auth required)
destinationRouter.put("/:id", protect, upload.single("image"), updateDestination);
// DELETE /:id — Delete a destination (auth required)
destinationRouter.delete("/:id", protect, deleteDestination);

export default destinationRouter;
