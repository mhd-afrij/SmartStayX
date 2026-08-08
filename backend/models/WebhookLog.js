// WebhookLog.js — Webhook event log schema for auditing and debugging
import mongoose from 'mongoose';

const webhookLogSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true }, // Unique identifier for the webhook event
    processedAt: { type: Date, default: Date.now }, // Timestamp when the event was processed
    payload: { type: Object, default: {} }, // Raw webhook payload data
  },
  { timestamps: true }
);

const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);

export default WebhookLog;
