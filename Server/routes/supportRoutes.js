// supportRoutes.js — Customer support conversation routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createSupportConversation, getMySupportConversations, getConversationMessages, sendSupportMessage, updateConversationStatus } from "../controllers/supportController.js";

const supportRouter = express.Router();

supportRouter.post("/conversations", protect, createSupportConversation);
supportRouter.get("/conversations", protect, getMySupportConversations);
supportRouter.get("/conversations/:conversationId", protect, getConversationMessages);
supportRouter.post("/messages", protect, sendSupportMessage);
supportRouter.post("/status", protect, updateConversationStatus);

export default supportRouter;
