import guestAssistantService from '../services/guestAssistantService.js';

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
