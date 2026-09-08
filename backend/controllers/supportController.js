// supportController.js — Support ticket CRUD operations
import SupportTicket from "../models/SupportTicket.js";

export const getTickets = async (req, res) => {
  try {
    // Listing every support ticket is a staff capability, not a guest one.
    const role = req.user?.role;
    if (!["super_admin", "hotel_manager", "receptionist"].includes(role)) {
      return res.status(403).json({ success: false, message: "Not authorized to view all tickets" });
    }
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
    const role = req.user?.role;
    if (!["super_admin", "hotel_manager", "receptionist"].includes(role)) {
      return res.status(403).json({ success: false, message: "Not authorized to update tickets" });
    }
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    ticket.status = status;
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
