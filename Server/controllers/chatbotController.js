import chatbotService from '../services/chatbotService.js';

export const createConversation = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || 'anonymous';
    const data = await chatbotService.createConversation(userId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI assistant is temporarily unavailable. Please ensure the AI service is running on port 8000, then try again.',
      service: 'ai-service',
    });
  }
};

export const listConversations = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || 'anonymous';
    const limit = parseInt(req.query.limit) || 20;
    const data = await chatbotService.listConversations(userId, limit);
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI assistant is temporarily unavailable. Please ensure the AI service is running on port 8000, then try again.',
      service: 'ai-service',
    });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const data = await chatbotService.getConversation(conversationId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI assistant is temporarily unavailable.',
      service: 'ai-service',
    });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const data = await chatbotService.deleteConversation(conversationId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI assistant is temporarily unavailable.',
      service: 'ai-service',
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || 'anonymous';
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.json({ success: false, message: 'Message is required' });
    }

    const data = await chatbotService.sendMessage(message, conversationId, userId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI assistant is temporarily unavailable. Please ensure the AI service is running on port 8000, then try again.',
      service: 'ai-service',
    });
  }
};

export const sendMessageStream = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || 'anonymous';
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.json({ success: false, message: 'Message is required' });
    }

    const streamUrl = chatbotService.getMessageStreamUrl();

    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ message, conversationId }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.statusText}`);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value));
      }
    } finally {
      reader.releaseLock();
    }

    res.end();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI assistant is temporarily unavailable. Please ensure the AI service is running on port 8000, then try again.',
      service: 'ai-service',
    });
  }
};

export const planTrip = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || 'anonymous';
    const payload = req.body;

    const data = await chatbotService.planTrip(payload, userId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI assistant is temporarily unavailable. Please ensure the AI service is running on port 8000, then try again.',
      service: 'ai-service',
    });
  }
};

export const checkHealth = async (req, res) => {
  const healthy = await chatbotService.isHealthy();
  res.json({
    success: true,
    data: {
      service: 'ai-service',
      status: healthy ? 'connected' : 'disconnected',
      url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    },
  });
};
