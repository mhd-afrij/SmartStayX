// SupportConversation.js — Support conversation schema with messages and status
import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ["guest", "agent", "bot"],
      default: "guest",
    },
    text: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: ["api", "socket", "bot"],
      default: "api",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const supportConversationSchema = new mongoose.Schema(
  {
    guest: { type: String, ref: "User", required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    status: {
      type: String,
      enum: ["open", "resolved", "closed"],
      default: "open",
    },
    subject: { type: String, default: "Guest Support" },
    messages: [supportMessageSchema],
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

supportConversationSchema.index({ guest: 1, createdAt: -1 });
supportConversationSchema.index({ hotel: 1, status: 1 });

const SupportConversation = mongoose.model("SupportConversation", supportConversationSchema);

export default SupportConversation;
