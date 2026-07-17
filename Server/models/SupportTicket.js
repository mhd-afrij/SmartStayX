// SupportTicket.js — Support ticket schema: subject, message, status, and user reference
import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true }, // Clerk user ID
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;
