// supportController.js — Support ticket CRUD operations
import SupportTicket from "../models/SupportTicket.js";

export const getTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user?._id || req.user?.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const ticket = await SupportTicket.create({
      user: req.user?._id || req.user?.id,
      subject,
      message,
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
