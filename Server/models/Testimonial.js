import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    review: { type: String, required: true, trim: true },
    isVisible: { type: Boolean, default: true },
    createdBy: { type: String, ref: "User", default: null },
  },
  { timestamps: true }
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;
