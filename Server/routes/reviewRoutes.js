import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getRoomReviews,
  createOrUpdateRoomReview,
  getOwnerReviews,
  toggleReviewVisibility,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.get("/room/:roomId", getRoomReviews);
reviewRouter.post("/room/:roomId", protect, createOrUpdateRoomReview);
reviewRouter.get("/owner", protect, getOwnerReviews);
reviewRouter.patch("/:reviewId/visibility", protect, toggleReviewVisibility);

export default reviewRouter;
