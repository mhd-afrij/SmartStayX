import { v2 as cloudinary } from "cloudinary";
import Offer from "../models/Offer.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";

const getAuthUserId = (req) => {
  const auth = typeof req.auth === "function" ? req.auth() : req.auth;
  return auth?.userId;
};

export const createOffer = async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const { title, description, discountPercent, expiryDate, roomId } = req.body;

    if (!ownerId) return res.json({ success: false, message: "Not authenticated" });
    if (!title || !description || !discountPercent || !expiryDate || !roomId) {
      return res.json({ success: false, message: "All fields are required" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.json({ success: false, message: "Room not found" });

    const hotel = await Hotel.findById(room.hotel);
    if (!hotel || hotel.owner !== ownerId) {
      return res.json({ success: false, message: "Not authorized for this hotel" });
    }

    let imageUrl = null;
    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path);
      imageUrl = uploadRes.secure_url;
    }

    const offer = await Offer.create({
      title,
      description,
      discountPercent: Number(discountPercent),
      expiryDate,
      image: imageUrl,
      room: room._id,
      hotel: hotel._id,
      owner: ownerId,
      isActive: true,
    });

    res.json({ success: true, message: "Offer created", offer });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getOffers = async (_req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      isActive: true,
      expiryDate: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .populate("room")
      .populate("hotel");

    res.json({ success: true, offers });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getOwnerOffers = async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const hotels = await Hotel.find({ owner: ownerId });
    const hotelIds = hotels.map((h) => h._id.toString());

    const offers = await Offer.find({ hotel: { $in: hotelIds } })
      .sort({ createdAt: -1 })
      .populate("room")
      .populate("hotel");

    res.json({ success: true, offers });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const { id } = req.params;
    const { title, description, discountPercent, expiryDate, roomId, isActive } = req.body;

    const offer = await Offer.findById(id);
    if (!offer) return res.json({ success: false, message: "Offer not found" });

    const hotel = await Hotel.findById(offer.hotel);
    if (!hotel || hotel.owner !== ownerId) {
      return res.json({ success: false, message: "Not authorized to update" });
    }

    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room) return res.json({ success: false, message: "Room not found" });
      const roomHotel = await Hotel.findById(room.hotel);
      if (!roomHotel || roomHotel.owner !== ownerId) {
        return res.json({ success: false, message: "Not authorized for selected room" });
      }
      offer.room = room._id;
      offer.hotel = room.hotel;
    }

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path);
      offer.image = uploadRes.secure_url;
    }

    if (title) offer.title = title;
    if (description) offer.description = description;
    if (discountPercent !== undefined) offer.discountPercent = Number(discountPercent);
    if (expiryDate) offer.expiryDate = expiryDate;
    if (isActive !== undefined) offer.isActive = isActive === "true" || isActive === true;

    await offer.save();
    const updated = await Offer.findById(id).populate("room").populate("hotel");
    res.json({ success: true, message: "Offer updated", offer: updated });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const { id } = req.params;

    const offer = await Offer.findById(id);
    if (!offer) return res.json({ success: false, message: "Offer not found" });

    const hotel = await Hotel.findById(offer.hotel);
    if (!hotel || hotel.owner !== ownerId) {
      return res.json({ success: false, message: "Not authorized to delete" });
    }

    await Offer.findByIdAndDelete(id);
    res.json({ success: true, message: "Offer deleted" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
