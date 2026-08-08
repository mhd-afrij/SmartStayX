// checkinRoutes.js — Self-service check-in and check-out routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  initiateCheckin, getCheckinStatus, getUserCheckins,
  approveCheckin, completeCheckout, getHotelCheckins,
} from "../controllers/checkinController.js";

const checkinRouter = express.Router();

checkinRouter.post("/", protect, initiateCheckin);
checkinRouter.get("/", protect, getCheckinStatus);
checkinRouter.get("/user", protect, getUserCheckins);
checkinRouter.get("/hotel", protect, getHotelCheckins);
checkinRouter.post("/:id/approve", protect, approveCheckin);
checkinRouter.post("/checkout", protect, completeCheckout);

export default checkinRouter;
