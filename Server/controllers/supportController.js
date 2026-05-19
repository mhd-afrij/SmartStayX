import Hotel from "../models/Hotel.js";
import SupportConversation from "../models/SupportConversation.js";

const canAccessConversation = async (conversation, userId) => {
  if (!conversation || !userId) return false;
  if (String(conversation.guest) === String(userId)) return true;
  if (!conversation.hotel) return false;

  const ownerHotel = await Hotel.findOne({ _id: conversation.hotel, owner: userId });
  return Boolean(ownerHotel);
};

export const createSupportConversation = async (req, res) => {
  try {
    const { bookingId, hotelId, subject } = req.body;
    const guestId = req.user._id;

    const conversation = await SupportConversation.create({
      guest: guestId,
      booking: bookingId || null,
      hotel: hotelId || null,
      subject: subject || "Guest Support",
      status: "open",
    });

    res.json({ success: true, conversation });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getMySupportConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const ownerHotels = await Hotel.find({ owner: userId }).select("_id");
    const ownerHotelIds = ownerHotels.map((h) => h._id);

    const conversations = await SupportConversation.find({
      $or: [{ guest: userId }, { hotel: { $in: ownerHotelIds } }],
    })
      .populate("hotel booking")
      .sort({ lastMessageAt: -1 })
      .limit(50);

    res.json({ success: true, conversations });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await SupportConversation.findById(conversationId).populate("hotel booking");

    if (!conversation) {
      return res.json({ success: false, message: "Conversation not found" });
    }

    const allowed = await canAccessConversation(conversation, req.user._id);
    if (!allowed) {
      return res.json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, conversation });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const sendSupportMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    if (!conversationId || !text || !text.trim()) {
      return res.json({ success: false, message: "conversationId and text are required" });
    }

    const conversation = await SupportConversation.findById(conversationId);
    if (!conversation) {
      return res.json({ success: false, message: "Conversation not found" });
    }

    const allowed = await canAccessConversation(conversation, req.user._id);
    if (!allowed) {
      return res.json({ success: false, message: "Not authorized" });
    }

    const message = {
      senderId: req.user._id,
      senderRole: String(conversation.guest) === String(req.user._id) ? "guest" : "agent",
      text: text.trim(),
      source: "api",
      createdAt: new Date(),
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.json({ success: true, message });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateConversationStatus = async (req, res) => {
  try {
    const { conversationId, status } = req.body;
    const allowedStatuses = ["open", "resolved", "closed"];

    if (!conversationId || !allowedStatuses.includes(status)) {
      return res.json({ success: false, message: "conversationId and valid status are required" });
    }

    const conversation = await SupportConversation.findById(conversationId);
    if (!conversation) {
      return res.json({ success: false, message: "Conversation not found" });
    }

    const allowed = await canAccessConversation(conversation, req.user._id);
    if (!allowed) {
      return res.json({ success: false, message: "Not authorized" });
    }

    conversation.status = status;
    await conversation.save();

    res.json({ success: true, conversation });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
