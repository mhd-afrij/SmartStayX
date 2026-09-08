import express from 'express';
import { chat, chatStream } from '../controllers/guestAssistantController.js';

const router = express.Router();

router.post('/chat', chat);
router.post('/chat/stream', chatStream);

export default router;
