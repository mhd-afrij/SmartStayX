// hotelController.js — Hotel CRUD operations and owner hotel management
import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import Room from "../models/Room.js";
import Offer from "../models/Offer.js";
import Booking from "../models/Booking.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Staff from "../models/Staff.js";
import { v2 as cloudinary } from "cloudinary";

// Hotel CRUD, search, and owner operations — includes cascading delete.
const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Register a new hotel and promote user to hotelOwner role.
export const registerHotel = async (req, res) => {
  try {
    const { name, address, contact, city, description } = req.body;
    const owner = req.user?._id;

    if (!owner) {
      return res.json({ success: false, message: "User not authenticated" });
    }

    if (!name || !address || !contact || !city) {
      return res.json({ success: false, message: "All hotel fields are required" });
    }

    await Hotel.create({
      name: String(name).trim(),
      address: String(address).trim(),
      contact: String(contact).trim(),
      city: String(city).trim(),
      description: description ? String(description).trim() : "",
      owner,
    });

    await User.findByIdAndUpdate(owner, { role: "hotelOwner" });

    res.json({ success: true, message: "Hotel Registered Successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Fetch hotels owned by the current user.
export const getOwnerHotel = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.json({ success: false, message: "User not authenticated" });
    }

    const hotels = await Hotel.find({ owner: userId });

    if (!hotels || hotels.length === 0) {
      return res.json({ success: false, message: "No hotels found" });
    }

    res.json({ success: true, hotel: hotels[0], hotels });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Public hotel listings.
export const getAllHotels = async (_req, res) => {
  try {
    const hotels = await Hotel.find({});
    res.json({ success: true, hotels });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update hotel details with optional Cloudinary image upload.
export const updateOwnerHotel = async (req, res) => {
  try {
    const ownerId = String(req.user?._id || "");
    const { id } = req.params;
    const { name, address, contact, city, description } = req.body;

    if (!ownerId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.json({ success: false, message: "Hotel not found" });
    }

    if (String(hotel.owner) !== ownerId) {
      return res.json({ success: false, message: "Not authorized to update this hotel" });
    }

    if (name) hotel.name = String(name).trim();
    if (address) hotel.address = String(address).trim();
    if (contact) hotel.contact = String(contact).trim();
    if (city) hotel.city = String(city).trim();
    hotel.description = description ? String(description).trim() : "";

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path);
      hotel.image = uploadRes.secure_url;
    }

    await hotel.save();
    return res.json({ success: true, message: "Hotel updated successfully", hotel });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.json({ success: false, message: "Hotel not found" });
    }

    return res.json({ success: true, hotel });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const searchHotels = async (req, res) => {
  try {
    const { query = "", city = "" } = req.query;
    const filters = [];

    if (String(query).trim()) {
      const regex = new RegExp(escapeRegex(String(query).trim()), "i");
      filters.push({ name: regex });
    }

    if (String(city).trim()) {
      const cityRegex = new RegExp(escapeRegex(String(city).trim()), "i");
      filters.push({ city: cityRegex });
    }

    const searchFilter = filters.length > 0 ? { $and: filters } : {};
    const hotels = await Hotel.find(searchFilter).sort({ createdAt: -1 });

    return res.json({ success: true, hotels, count: hotels.length });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const deleteOwnerHotel = async (req, res) => {
  try {
    const ownerId = String(req.user?._id || "");
    const { id } = req.params;

    if (!ownerId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.json({ success: false, message: "Hotel not found" });
    }

    if (String(hotel.owner) !== ownerId) {
      return res.json({ success: false, message: "Not authorized to delete this hotel" });
    }

    const roomIds = (await Room.find({ hotel: hotel._id }).select("_id")).map((r) => r._id);

    await Promise.all([
      Offer.deleteMany({ hotel: String(hotel._id) }),
      Booking.deleteMany({ hotel: hotel._id }),
      ServiceRequest.deleteMany({ hotel: hotel._id }),
      Staff.deleteMany({ hotel: hotel._id }),
      roomIds.length > 0 ? Offer.deleteMany({ room: { $in: roomIds.map((id) => String(id)) } }) : Promise.resolve(),
      roomIds.length > 0 ? Booking.deleteMany({ room: { $in: roomIds } }) : Promise.resolve(),
      roomIds.length > 0 ? ServiceRequest.deleteMany({ room: { $in: roomIds } }) : Promise.resolve(),
      Room.deleteMany({ hotel: hotel._id }),
    ]);

    await Hotel.findByIdAndDelete(hotel._id);

    return res.json({ success: true, message: "Hotel and related records deleted" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
