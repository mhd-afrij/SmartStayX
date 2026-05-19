import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getRoomReviews, createOrUpdateRoomReview } from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.get("/room/:roomId", getRoomReviews);
reviewRouter.post("/room/:roomId", protect, createOrUpdateRoomReview);

export default reviewRouter;
