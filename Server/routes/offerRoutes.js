// offerRoutes.js — Promotional offer CRUD and management routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { getOffers, getOwnerOffers, createOffer, updateOffer, deleteOffer } from "../controllers/offerController.js";

const offerRouter = express.Router();

offerRouter.get("/", getOffers);
offerRouter.get("/owner", protect, getOwnerOffers);
offerRouter.post("/", protect, upload.single("image"), createOffer);
offerRouter.put("/:id", protect, upload.single("image"), updateOffer);
offerRouter.delete("/:id", protect, deleteOffer);

export default offerRouter;
