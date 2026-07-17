// offerRoutes.js — Promotional offer CRUD and management routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { getOffers, getOwnerOffers, createOffer, updateOffer, deleteOffer } from "../controllers/offerController.js";

const offerRouter = express.Router();

// GET / — Get all active offers (public)
offerRouter.get("/", getOffers);
// GET /owner — Get offers created by the authenticated owner
offerRouter.get("/owner", protect, getOwnerOffers);
// POST / — Create a new offer with image upload (auth required)
offerRouter.post("/", protect, upload.single("image"), createOffer);
// PUT /:id — Update an offer with image upload (auth required)
offerRouter.put("/:id", protect, upload.single("image"), updateOffer);
// DELETE /:id — Delete an offer (auth required)
offerRouter.delete("/:id", protect, deleteOffer);

export default offerRouter;
