// testimonialRoutes.js — Testimonial CRUD and visibility management routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getVisibleTestimonials, getOwnerTestimonials, updateTestimonial, updateTestimonialVisibility } from "../controllers/testimonialController.js";

const testimonialRouter = express.Router();

// GET / — Get all visible testimonials (public)
testimonialRouter.get("/", getVisibleTestimonials);
// GET /owner — Get testimonials for the owner's hotels (auth required)
testimonialRouter.get("/owner", protect, getOwnerTestimonials);
// PUT /:id — Update a testimonial (auth required)
testimonialRouter.put("/:id", protect, updateTestimonial);
// PATCH /:id/visibility — Toggle testimonial visibility (auth required)
testimonialRouter.patch("/:id/visibility", protect, updateTestimonialVisibility);

export default testimonialRouter;
