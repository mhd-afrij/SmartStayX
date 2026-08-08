import { Router } from 'express';
import {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  sendMessage,
  sendMessageStream,
  planTrip,
  checkHealth,
} from '../controllers/chatbotController.js';

const router = Router();

router.get('/health', checkHealth);
router.post('/conversations', createConversation);
router.get('/conversations', listConversations);
router.get('/conversations/:conversationId', getConversation);
router.delete('/conversations/:conversationId', deleteConversation);
router.post('/message', sendMessage);
router.post('/message/stream', sendMessageStream);
router.post('/trip-planner', planTrip);

export default router;
