// transportController.js — Transport options CRUD operations
import Transport from "../models/Transport.js";

export const getTransports = async (req, res) => {
  try {
    const filter = {};
    if (req.query.from) filter.from = req.query.from;
    if (req.query.to) filter.to = req.query.to;
    const transports = await Transport.find(filter).sort({ departureTime: 1 });
    res.json({ success: true, data: transports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransportById = async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id);
    if (!transport) return res.status(404).json({ success: false, message: "Transport not found" });
    res.json({ success: true, data: transport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTransport = async (req, res) => {
  try {
    const transport = await Transport.create(req.body);
    res.status(201).json({ success: true, data: transport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTransport = async (req, res) => {
  try {
    const transport = await Transport.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!transport) return res.status(404).json({ success: false, message: "Transport not found" });
    res.json({ success: true, data: transport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTransport = async (req, res) => {
  try {
    const transport = await Transport.findByIdAndDelete(req.params.id);
    if (!transport) return res.status(404).json({ success: false, message: "Transport not found" });
    res.json({ success: true, message: "Transport deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
