// roomController.js — Room CRUD, availability, and search with filtering
import Hotel from "../models/Hotel.js";
import { v2 as cloudinary } from "cloudinary";
import Room from "../models/Room.js";
import roomService from "../services/roomService.js";

// Room CRUD, listing, trending — both public and owner-scoped.
const getAuthUserId = (req) => {
  const auth = typeof req.auth === "function" ? req.auth() : req.auth;
  return auth?.userId;
};

const isRoomOwnedByUser = async (room, userId) => {
  const ownerHotels = await Hotel.find({ owner: userId });
  const ownerHotelIds = ownerHotels.map((h) => h._id.toString());
  return ownerHotelIds.includes(room.hotel._id.toString());
};

// Create a room for an owned hotel with Cloudinary image upload.
export const createRoom = async (req, res) => {
  try {
    const { roomType, pricePerNight, amenities, hotelId } = req.body;
    const userId = getAuthUserId(req);

    if (typeof hotelId !== 'string') {
      return res.json({ success: false, message: "Please select a hotel" });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.json({ success: false, message: "No Hotel Found" });

    if (hotel.owner !== userId) {
      return res.json({ success: false, message: "Not authorized to add room to this hotel" });
    }

    const uploadImages = req.files.map(async (file) => {
      const response = await cloudinary.uploader.upload(file.path);
      return response.secure_url;
    });

    const images = await Promise.all(uploadImages);

    await Room.create({
      hotel: hotel._id,
      hotelName: hotel.name,
      hotelAddress: hotel.address,
      hotelCity: hotel.city,
      roomType,
      pricePerNight: +pricePerNight,
      amenities: JSON.parse(amenities),
      images,
    });

    res.json({ success: true, message: "Room Created successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Public room listing with pagination (delegates to roomService with caching).
export const getRooms = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, roomType, minPrice, maxPrice, destination, minRating } = req.query;
    const filter = {};
    if (roomType) filter.roomType = roomType;
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }
    if (destination) {
      filter.hotelCity = { $regex: destination.trim(), $options: 'i' };
    }
    const data = await roomService.getRooms({ page, limit, filter });
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

// Rooms managed by the current owner for dashboard display.
export const getOwnerRooms = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.json({ success: false, message: "Not authenticated" });

    const rooms = await roomService.getOwnerRooms({ userId });
    return res.json({ success: true, rooms });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Toggle room availability (owner only, invalidates Redis cache).
export const toggleRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = getAuthUserId(req);
    const room = await roomService.toggleAvailability({ roomId, userId });
    res.json({ success: true, room, message: "Room availability updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { id } = req.params;

    const room = await Room.findById(id).populate("hotel");
    if (!room) {
      return res.json({ success: false, message: "Room not found" });
    }

    if (!(await isRoomOwnedByUser(room, userId))) {
      return res.json({ success: false, message: "Not authorized to delete this room" });
    }

    await Room.findByIdAndDelete(id);
    res.json({ success: true, message: "Room deleted" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id).populate({
      path: "hotel",
      populate: { path: "owner", select: "image name username" },
    });

    if (!room) return res.json({ success: false, message: "Room not found" });

    res.json({ success: true, room });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getTrendingRooms = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 25);
    const rooms = await roomService.getTrendingRooms({ limit });
    res.json({ success: true, rooms });
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { id } = req.params;
    const { roomType, pricePerNight, amenities, isAvailable } = req.body;

    const room = await Room.findById(id).populate("hotel");
    if (!room) {
      return res.json({ success: false, message: "Room not found" });
    }

    if (!(await isRoomOwnedByUser(room, userId))) {
      return res.json({ success: false, message: "Not authorized to edit this room" });
    }

    if (roomType !== undefined) {
      room.roomType = roomType;
    }

    if (pricePerNight !== undefined) {
      const parsedPrice = Number(pricePerNight);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.json({ success: false, message: "Price per night must be a valid number" });
      }
      room.pricePerNight = parsedPrice;
    }

    if (amenities !== undefined) {
      if (!Array.isArray(amenities)) {
        return res.json({ success: false, message: "Amenities must be an array" });
      }
      room.amenities = amenities;
    }

    if (isAvailable !== undefined) {
      room.isAvailable = Boolean(isAvailable);
    }

    await room.save();
    return res.json({ success: true, message: "Room updated successfully", room });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
