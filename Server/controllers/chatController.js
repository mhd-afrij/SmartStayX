import Booking from "../models/Booking.js";
import ChatLog from "../models/ChatLog.js";
import SupportConversation from "../models/SupportConversation.js";
import { OPENAI_BASE_URL } from "../configs/runtimeDefaults.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";

// Chat intent detection and response generation — rule-based + LLM fallback.
const detectIntent = (message = "") => {
  const text = message.toLowerCase();
  if (/\b(booking|reservation)\b[\s\S]{0,50}\b(status|confirm)\b|\bstatus\b[\s\S]{0,50}\b(booking|reservation)\b/.test(text)) return "booking_status";
  if (/(cancel|refund|reschedule)/.test(text)) return "cancellation";
  if (/(available|availability|vacant)/.test(text)) return "availability";
  if (/(pay|payment|card|stripe)/.test(text)) return "payment";
  if (/(service|housekeeping|maintenance|room service|support)/.test(text)) return "service_request";
  return "general";
};

const callLlmFallback = async ({ userMessage, contextText }) => {
  // LLM fallback for general intents — queries OpenAI-compatible API.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL || OPENAI_BASE_URL;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are SmartStayX assistant — a full-stack hotel booking platform. Tech: React 19, Vite, Tailwind, Framer Motion (frontend); Node.js, Express, MongoDB/Mongoose, Redis/ioredis (backend); Clerk (auth), Stripe (payments), Cloudinary (media), OpenAI (AI), Google Places API. Features: hotel/room browsing & filtering, dynamic pricing (seasonal, weekend, length-of-stay, early-bird, last-minute, repeat-guest discounts), AI trip planner, recommendations, multi-currency (USD/EUR/GBP/AED/SGD/LKR), multi-language support, hotel owner dashboard, distributed booking locks. Keep responses short, practical, and booking-focused. Never invent booking IDs.",
          },
          { role: "system", content: `Context: ${contextText}` },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    return null;
  }
};

const buildContext = async (userId) => {
  // Gather upcoming and recent bookings to provide context-aware replies.
  const upcoming = await Booking.find({
    user: userId,
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
    checkOutDate: { $gte: new Date() },
  })
    .populate("room hotel")
    .sort({ checkInDate: 1 })
    .limit(3);

  const latest = await Booking.find({ user: userId })
    .populate("room hotel")
    .sort({ createdAt: -1 })
    .limit(5);

  return { upcoming, latest };
};

const getRuleReply = ({ intent, context }) => {
  // Deterministic replies for booking intents — no LLM needed here.
  const nextBooking = context.upcoming[0];

  if (intent === "booking_status") {
    if (!nextBooking) {
      return "You do not have an upcoming booking yet. I can help you search available rooms and complete a booking.";
    }
    return `Your next booking is ${nextBooking.hotel?.name || "your hotel"} from ${new Date(nextBooking.checkInDate).toDateString()} to ${new Date(nextBooking.checkOutDate).toDateString()}. Current status: ${nextBooking.status}.`;
  }

  if (intent === "cancellation") {
    return "You can cancel from My Bookings before check-in. Paid bookings require support review depending on policy.";
  }

  if (intent === "availability") {
    return "To check live availability, open a room and select check-in and check-out dates. I can also guide you by city and budget.";
  }

  if (intent === "payment") {
    return "SmartStayX supports pay-at-hotel and Stripe checkout. You can complete payment from the My Bookings page.";
  }

  if (intent === "service_request") {
    return "You can request services like housekeeping, maintenance, and room service after booking confirmation. I can also connect you to live support now.";
  }

  return "I can help with booking status, availability, cancellations, payments, and live support. Tell me what you need.";
};

export const sendChatMessage = async (req, res) => {
  try {
    // Process user message: detect intent, build context, generate reply, persist.
    const userId = req.user?._id;
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.json({ success: false, message: "message is required" });
    }

    const intent = detectIntent(message);
    const context = await buildContext(userId);
    const contextText = `Upcoming bookings: ${context.upcoming.length}, Recent bookings: ${context.latest.length}`;

    let reply = getRuleReply({ intent, context });
    if (intent === "general") {
      const llmReply = await callLlmFallback({ userMessage: message, contextText });
      if (llmReply) reply = llmReply;
    }

    await ChatLog.create({
      user: userId,
      message,
      reply,
      intent,
      metadata: {
        conversationId: conversationId || null,
        upcomingCount: context.upcoming.length,
      },
    });

    if (typeof conversationId === 'string') {
      const update = {
        $push: {
          messages: {
            $each: [
              { senderId: userId, senderRole: "guest", text: message, source: "bot" },
              { senderId: "smartstayx-bot", senderRole: "bot", text: reply, source: "bot" },
            ],
          },
        },
        $set: { lastMessageAt: new Date() },
      };
      await SupportConversation.findByIdAndUpdate(conversationId, update);
    }

    res.json({
      success: true,
      intent,
      reply,
      bookingAware: intent === "booking_status",
      quickActions: ["Check my bookings", "Cancel policy", "Connect live support"],
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    // Return the 30 most-recent chat logs for the current user.
    const logs = await ChatLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("message reply intent createdAt");

    res.json({ success: true, logs });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
