// testimonialController.js — Testimonial CRUD and visibility management
import Testimonial from "../models/Testimonial.js";
import Review from "../models/Review.js";
import Hotel from "../models/Hotel.js";
import { clerkClient } from "@clerk/express";
import { DEFAULT_TESTIMONIALS } from "../configs/runtimeDefaults.js";

// Testimonial management — combines manual testimonials with positive reviews for display.
// Only hotel owners (or admins) may manage testimonials; users who own a hotel are auto-promoted.
const ensureOwner = async (req, res) => {
  if (req.user?.role === "hotel_manager" || req.user?.role === "super_admin") return true;

  const hasHotel = await Hotel.exists({ owner: req.user?._id });
  if (hasHotel) {
    await req.user.constructor.findByIdAndUpdate(req.user._id, { role: "hotel_manager" });
    // Persist to Clerk metadata so the auth middleware's role re-sync keeps it.
    try {
      await clerkClient.users.updateUserMetadata(req.user._id, { publicMetadata: { role: "hotel_manager" } });
    } catch (clerkError) {
      console.warn("Failed to sync hotel_manager role to Clerk metadata:", clerkError.message);
    }
    req.user.role = "hotel_manager";
    return true;
  }

  res.json({ success: false, message: "Only hotel owners can manage testimonials" });
  return false;
};

// Get visible testimonials combined with positive reviews for public display
export const getVisibleTestimonials = async (_req, res) => {
  try {
    const [testimonials, reviews] = await Promise.all([
      Testimonial.find({ isVisible: true }).sort({ createdAt: -1 }),
      Review.find({ isVisible: true, comment: { $exists: true, $ne: "" } })
        .populate("user", "name username image")
        .populate("hotel", "city name")
        .sort({ createdAt: -1 })
        .limit(12),
    ]);

    const mappedReviews = reviews.map((item) => ({
      _id: item._id,
      name: item.user?.name || item.user?.username || "Guest",
      address: item.hotel?.city || item.hotel?.name || "Guest Review",
      image: item.user?.image || "",
      rating: Number(item.rating || 5),
      review: String(item.comment || "").trim(),
      source: "review",
      createdAt: item.createdAt,
    }));

    const mappedTestimonials = testimonials.map((item) => ({
      ...item.toObject(),
      source: "testimonial",
    }));

    const combined = [...mappedReviews, ...mappedTestimonials]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 12);

    res.json({ success: true, testimonials: combined });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get testimonials for owner management (seeds defaults if none exist)
export const getOwnerTestimonials = async (req, res) => {
  try {
    if (!(await ensureOwner(req, res))) return;

    let testimonials = await Testimonial.find({}).sort({ createdAt: -1 });

    if (testimonials.length === 0) {
      const ownerId = req.user?._id || null;
      const seedData = DEFAULT_TESTIMONIALS.map((item) => ({
        ...item,
        isVisible: true,
        createdBy: ownerId,
      }));

      await Testimonial.insertMany(seedData);
      testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
    }

    res.json({ success: true, testimonials });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update a testimonial's name, address, rating, or review text
export const updateTestimonial = async (req, res) => {
  try {
    if (!(await ensureOwner(req, res))) return;

    const { id } = req.params;
    const { name, address, rating, review } = req.body;

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.json({ success: false, message: "Testimonial not found" });
    }

    if (name !== undefined) testimonial.name = String(name).trim() || testimonial.name;
    if (address !== undefined) testimonial.address = String(address).trim() || testimonial.address;
    if (review !== undefined) testimonial.review = String(review).trim() || testimonial.review;
    if (rating !== undefined) {
      testimonial.rating = Math.min(5, Math.max(1, Number(rating) || 1));
    }

    await testimonial.save();

    res.json({ success: true, testimonial, message: "Testimonial updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Toggle a testimonial's visibility on the public page
export const updateTestimonialVisibility = async (req, res) => {
  try {
    if (!(await ensureOwner(req, res))) return;

    const { id } = req.params;
    const { isVisible } = req.body;

    if (typeof isVisible !== "boolean") {
      return res.json({ success: false, message: "isVisible must be boolean" });
    }

    const testimonial = await Testimonial.findByIdAndUpdate(id, { isVisible }, { new: true });

    if (!testimonial) {
      return res.json({ success: false, message: "Testimonial not found" });
    }

    res.json({ success: true, testimonial, message: "Visibility updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
