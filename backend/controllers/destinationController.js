import Destination from "../models/Destination.js";
import { v2 as cloudinary } from "cloudinary";

// Create a new travel destination with optional Cloudinary image
export const createDestination = async (req, res) => {
  try {
    const { name, description, hotelCount, temperature, country, featured } = req.body;

    if (!name) {
      return res.json({ success: false, message: "Destination name is required" });
    }

    let image = "";
    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path);
      image = uploadRes.secure_url;
    }

    const destination = await Destination.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : "",
      hotelCount: hotelCount || "0 hotels",
      temperature: temperature || "",
      country: country || "",
      featured: featured === "true" || featured === true,
      image,
    });

    res.json({ success: true, message: "Destination created successfully", destination });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Retrieve all destinations sorted by creation date
export const getAllDestinations = async (_req, res) => {
  try {
    const destinations = await Destination.find({}).sort({ createdAt: -1 });
    res.json({ success: true, destinations });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get a single destination by its ID
export const getDestinationById = async (req, res) => {
  try {
    const { id } = req.params;
    const destination = await Destination.findById(id);
    if (!destination) {
      return res.json({ success: false, message: "Destination not found" });
    }
    return res.json({ success: true, destination });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Update destination fields and optionally upload a new image
export const updateDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, hotelCount, temperature, country, featured } = req.body;

    const destination = await Destination.findById(id);
    if (!destination) {
      return res.json({ success: false, message: "Destination not found" });
    }

    if (name) destination.name = String(name).trim();
    if (description !== undefined) destination.description = String(description).trim();
    if (hotelCount !== undefined) destination.hotelCount = hotelCount;
    if (temperature !== undefined) destination.temperature = temperature;
    if (country !== undefined) destination.country = country;
    if (featured !== undefined) destination.featured = featured === "true" || featured === true;

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path);
      destination.image = uploadRes.secure_url;
    }

    await destination.save();
    return res.json({ success: true, message: "Destination updated successfully", destination });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Delete a destination by ID
export const deleteDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const destination = await Destination.findByIdAndDelete(id);
    if (!destination) {
      return res.json({ success: false, message: "Destination not found" });
    }
    return res.json({ success: true, message: "Destination deleted successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
