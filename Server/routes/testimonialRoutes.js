import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getVisibleTestimonials, getOwnerTestimonials, updateTestimonial, updateTestimonialVisibility } from "../controllers/testimonialController.js";

const testimonialRouter = express.Router();

testimonialRouter.get("/", getVisibleTestimonials);
testimonialRouter.get("/owner", protect, getOwnerTestimonials);
testimonialRouter.put("/:id", protect, updateTestimonial);
testimonialRouter.patch("/:id/visibility", protect, updateTestimonialVisibility);

export default testimonialRouter;
