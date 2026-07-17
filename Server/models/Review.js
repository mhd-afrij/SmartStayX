// Review.js — Review schema: rating, content, room, and guest reference
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true }, // Clerk user ID of the reviewer
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }, // Room being reviewed
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true }, // Hotel being reviewed
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true }, // Booking associated with this review
    rating: { type: Number, min: 1, max: 5, required: true }, // Numerical rating (1-5)
    satisfaction: {
      type: String,
      enum: ["very_satisfied", "satisfied", "neutral", "dissatisfied", "very_dissatisfied"],
      required: true,
    }, // Verbal satisfaction level
    comment: { type: String, trim: true, maxlength: 500, default: "" }, // Written review text
    isVisible: { type: Boolean, default: true }, // Whether the review is publicly visible
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, room: 1 }, { unique: true }); // Ensure one review per user per room
reviewSchema.index({ room: 1, createdAt: -1 }); // Optimize fetching room reviews by date

const Review = mongoose.model("Review", reviewSchema);

export default Review;
