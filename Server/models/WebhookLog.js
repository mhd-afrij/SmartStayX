import mongoose from 'mongoose';

const webhookLogSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    processedAt: { type: Date, default: Date.now },
    payload: { type: Object, default: {} },
  },
  { timestamps: true }
);

const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);

export default WebhookLog;
