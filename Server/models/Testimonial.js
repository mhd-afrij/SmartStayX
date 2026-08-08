// Testimonial.js — Testimonial schema: content, author, rating, and visibility
import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // Name of the person giving the testimonial
    address: { type: String, required: true, trim: true }, // Location/address of the testimonial author
    image: { type: String, default: "" }, // URL to author's photo
    rating: { type: Number, min: 1, max: 5, default: 5 }, // Star rating (1-5)
    review: { type: String, required: true, trim: true }, // Testimonial text content
    isVisible: { type: Boolean, default: true }, // Whether the testimonial is publicly displayed
    createdBy: { type: String, ref: "User", default: null }, // Clerk user ID of the admin who created it
  },
  { timestamps: true }
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;
