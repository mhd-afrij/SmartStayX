import express from "express";
import upload from "../middleware/uploadMIddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { createOffer, deleteOffer, getOffers, getOwnerOffers, updateOffer } from "../controllers/offerController.js";

const offerRouter = express.Router();

offerRouter.get("/", getOffers);
offerRouter.get("/owner", protect, getOwnerOffers);
offerRouter.post("/", protect, upload.single("image"), createOffer);
offerRouter.put("/:id", protect, upload.single("image"), updateOffer);
offerRouter.delete("/:id", protect, deleteOffer);

export default offerRouter;
