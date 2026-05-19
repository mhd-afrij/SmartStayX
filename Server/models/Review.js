import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    satisfaction: {
      type: String,
      enum: ["very_satisfied", "satisfied", "neutral", "dissatisfied", "very_dissatisfied"],
      required: true,
    },
    comment: { type: String, trim: true, maxlength: 500, default: "" },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, room: 1 }, { unique: true });
reviewSchema.index({ room: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
