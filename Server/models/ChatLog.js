// ChatLog.js — Chat message schema with sender, content, and timestamps
import mongoose from "mongoose";

const chatLogSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    message: { type: String, required: true, trim: true },
    reply: { type: String, required: true, trim: true },
    intent: { type: String, default: "general" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

chatLogSchema.index({ user: 1, createdAt: -1 });

const ChatLog = mongoose.model("ChatLog", chatLogSchema);

export default ChatLog;
