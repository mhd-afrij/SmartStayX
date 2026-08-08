// Guest assistant service.
//
// Primary path: proxy the guest's message to the FastAPI AI microservice
// (`AI_SERVICE_URL` + `/api/chat/message`), which runs the LLM concierge with
// tool-calling and Mongo-backed conversation history.
//
// Fallback path: if the AI service is unreachable or misconfigured, degrade to
// a lightweight keyword matcher so the widget still returns something useful.

import axios from 'axios';
import { API } from '../configs/apiContracts.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
const AI_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 30000;

// ---------------------------------------------------------------------------
// Fallback: static keyword matcher (used only when the AI service is down)
// ---------------------------------------------------------------------------

const QUICK_REPLIES = {
  booking: [
    'Open the Rooms page to browse available stays.',
    'Choose a room, pick your dates, then continue to checkout.',
    'If you need help, I can explain the booking steps.',
  ],
  payment: [
    'You can pay during checkout or later from My Bookings.',
    'Accepted payment options depend on the booking flow shown at checkout.',
  ],
  support: [
    'For help with an existing reservation, visit Support or My Bookings.',
    'If something looks wrong, share the booking number and I will guide you.',
  ],
  rooms: [
    'Rooms and hotels are listed on the Rooms page.',
    'Open a room to see photos, amenities, price, and availability.',
  ],
  greet: [
    'I can help you book a stay, find rooms, or explain payment steps.',
    'Tell me what you need and I will point you to the right page.',
  ],
};

const detectTopic = (message = '') => {
  const text = message.toLowerCase();
  if (/(book|booking|reserve|reservation|available|availability|check-in|check out|checkout)/.test(text)) return 'booking';
  if (/(pay|payment|card|paypal|invoice|price|cost|refund)/.test(text)) return 'payment';
  if (/(help|support|contact|issue|problem|cancel|modify|change)/.test(text)) return 'support';
  if (/(room|hotel|suite|villa|stay|browse|find)/.test(text)) return 'rooms';
  return 'greet';
};

const fallbackReply = (message) => {
  const topic = detectTopic(message);
  const base = QUICK_REPLIES[topic];
  return {
    topic,
    message: base[0],
    suggestions: base.slice(1),
    conversationId: null,
    source: 'fallback',
  };
};

// ---------------------------------------------------------------------------
// Primary: proxy to the FastAPI AI microservice
// ---------------------------------------------------------------------------

const createReply = async (message, { userId, conversationId, language, languageName } = {}) => {
  try {
    const { data } = await axios.post(
      `${AI_SERVICE_URL}${API.ai.chat}`,
      {
        message,
        conversationId: conversationId || null,
        language: language || null,
        languageName: languageName || null,
      },
      {
        timeout: AI_TIMEOUT_MS,
        // The AI service reads the guest identity from the `user-id` header.
        headers: userId ? { 'user-id': userId } : {},
      }
    );

    return {
      message: data?.message || '',
      suggestions: [],
      conversationId: data?.conversationId || null,
      source: 'ai',
    };
  } catch (error) {
    // Network error, timeout, 5xx, or AI service unavailable -> graceful fallback.
    console.warn(`Guest assistant AI service unavailable, using fallback: ${error.message}`);
    return fallbackReply(message);
  }
};

export default {
  createReply,
};
