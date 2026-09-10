// hotelController.js — Hotel CRUD operations and owner hotel management
import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import Room from "../models/Room.js";
import Offer from "../models/Offer.js";
import Booking from "../models/Booking.js";
import ServiceRequest from "../models/ServiceRequest.js";
import { v2 as cloudinary } from "cloudinary";
import { clerkClient } from "@clerk/express";
import escapeRegex from "../utils/escapeRegex.js";
import { geocodeAddress } from "../services/googleMapsService.js";

// Hotel CRUD, search, and owner operations — includes cascading delete.

// Parses optional latitude/longitude input (string or number) into a Hotel
// location point. Returns undefined when no valid coordinates were provided.
const parseLocationInput = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  return { type: "Point", coordinates: [lng, lat] };
};

// Best-effort geocoding: resolves an address to coordinates and persists them
// when the hotel has no coordinates yet. Never fails the operation that calls
// it — the Trip Planner surfaces the "location incomplete" state if it fails.
const ensureHotelLocation = async (hotel, { force = false } = {}) => {
  if (!hotel) return;
  const coords = hotel.location?.coordinates;
  if (!force && Array.isArray(coords) && coords.length === 2) return;

  try {
    const resolved = await geocodeAddress({
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
    });
    if (resolved) {
      hotel.location = { type: "Point", coordinates: [resolved.longitude, resolved.latitude] };
      hotel.markModified("location");
      await hotel.save();
      console.log(`🗺️  Geocoded "${hotel.name}" → ${resolved.latitude},${resolved.longitude}`);
    }
  } catch (error) {
    console.warn(`Geocoding failed for "${hotel?.name}":`, error.message);
  }
};

// Register a new hotel and promote user to hotelOwner role.
export const registerHotel = async (req, res) => {
  try {
    const { name, address, contact, city, description, latitude, longitude, country, timezone } = req.body;
    const owner = req.user?._id;

    if (!owner) {
      return res.json({ success: false, message: "User not authenticated" });
    }

    if (!name || !address || !contact || !city) {
      return res.json({ success: false, message: "All hotel fields are required" });
    }

    const hotel = await Hotel.create({
      name: String(name).trim(),
      address: String(address).trim(),
      contact: String(contact).trim(),
      city: String(city).trim(),
      country: country ? String(country).trim() : "",
      description: description ? String(description).trim() : "",
      location: parseLocationInput(latitude, longitude),
      timezone: timezone ? String(timezone).trim() : "",
      owner,
    });

    // Promote the user to the "hotel_manager" role and scope them to the new
    // hotel. The auth middleware re-syncs roles from Clerk public metadata on
    // every request, so both must be persisted there too — otherwise the
    // manager gets demoted back to guest and loses their assigned hotel.
    await User.findByIdAndUpdate(owner, {
      role: "hotel_manager",
      assignedHotel: hotel._id,
    });
    try {
      await clerkClient.users.updateUserMetadata(owner, {
        publicMetadata: { role: "hotel_manager", hotelId: hotel._id.toString() },
      });
    } catch (clerkError) {
      console.warn("Failed to sync hotel_manager role to Clerk metadata:", clerkError.message);
    }

    // Geocode the address when the client did not supply coordinates, so the
    // Trip Planner always has a database-anchored origin.
    if (!parsedLocation) await ensureHotelLocation(hotel);

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
    const { name, address, contact, city, description, latitude, longitude, country, clearLocation, timezone } = req.body;

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
    if (country !== undefined) hotel.country = String(country || "").trim();
    if (timezone !== undefined) hotel.timezone = String(timezone || "").trim();
    hotel.description = description ? String(description).trim() : "";

    // Coordinates: set when valid latitude+longitude arrive; removed when the
    // client explicitly sends clearLocation (e.g. "true"). FormData sends
    // strings, so empty strings are treated as "not provided".
    const parsedLocation = parseLocationInput(latitude, longitude);
    if (parsedLocation) {
      hotel.location = parsedLocation;
    } else if (String(clearLocation || "").toLowerCase() === "true") {
      hotel.location = undefined;
    }

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.buffer, { resource_type: "auto" });
      hotel.image = uploadRes.secure_url;
    }

    await hotel.save();

    // When coordinates were neither supplied nor cleared, backfill them from
    // the (possibly updated) address so the Trip Planner has an origin.
    if (!parsedLocation && String(clearLocation || "").toLowerCase() !== "true") {
      await ensureHotelLocation(hotel);
    }

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
