// reviewRoutes.js — Guest review CRUD and moderation routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getRoomReviews,
  createOrUpdateRoomReview,
  getOwnerReviews,
  toggleReviewVisibility,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

// GET /room/:roomId — Get all reviews for a specific room (public)
reviewRouter.get("/room/:roomId", getRoomReviews);
// POST /room/:roomId — Create or update a review for a room (auth required)
reviewRouter.post("/room/:roomId", protect, createOrUpdateRoomReview);
// GET /owner — Get reviews for the owner's hotels (auth required)
reviewRouter.get("/owner", protect, getOwnerReviews);
// PATCH /:reviewId/visibility — Toggle visibility of a review (auth required)
reviewRouter.patch("/:reviewId/visibility", protect, toggleReviewVisibility);

export default reviewRouter;
