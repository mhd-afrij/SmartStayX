import guestAssistantService from '../services/guestAssistantService.js';
import { API } from '../configs/apiContracts.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
const AI_INTERNAL_TOKEN = process.env.AI_INTERNAL_TOKEN || '';

export const chatStream = async (req, res) => {
  const { message = '', conversationId, language, languageName } = req.body || {};
  if (!message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message is required.',
    });
  }

  const auth = req.user;
  const userId = auth?._id || auth?.id || undefined;

  // SSE headers first: once streaming starts we can no longer send a JSON
  // error body, so every failure is translated into token/done events.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event, data) => {
    if (!res.writableEnded) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  const abort = new AbortController();
  req.on('close', () => abort.abort());

  let upstream;
  try {
    upstream = await fetch(`${AI_SERVICE_URL}${API.ai.chatStream}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'user-id': String(userId) } : {}),
        ...(AI_INTERNAL_TOKEN ? { 'x-internal-token': AI_INTERNAL_TOKEN } : {}),
      },
      body: JSON.stringify({ message, conversationId, language, languageName }),
      signal: abort.signal,
    });

    if (!upstream.ok || !upstream.body) {
      throw new Error(`AI service responded ${upstream.status}`);
    }

    // Raw SSE passthrough — the AI service already emits token/done events.
    for await (const chunk of upstream.body) {
      if (res.writableEnded) break;
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    if (!abort.signal.aborted) {
      send('token', {
        token:
          'I could not reach the booking assistant just now. Please try again in a moment.',
      });
      send('done', { conversationId: conversationId || null });
    }
    res.end();
  }
};

export const chat = async (req, res) => {
  try {
    const { message = '', conversationId, language, languageName } = req.body || {};
    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required.',
      });
    }

    // Attach the authenticated guest identity when available so the AI service
    // can personalise replies (bookings, preferences). Anonymous is fine too.
    const auth = req.user;
    const userId = auth?._id || auth?.id || undefined;

    const reply = await guestAssistantService.createReply(message, {
      userId,
      conversationId,
      language,
      languageName,
    });

    res.json({
      success: true,
      data: {
        reply,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Guest assistant is temporarily unavailable.',
    });
  }
};
