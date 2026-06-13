// chatRoutes.js — Chat/messaging API routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendChatMessage, getChatHistory } from "../controllers/chatController.js";

// Chat API routes.
const chatRouter = express.Router();

chatRouter.post("/message", protect, sendChatMessage);
chatRouter.get("/history", protect, getChatHistory);

export default chatRouter;
