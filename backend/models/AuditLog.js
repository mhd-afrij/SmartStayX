import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: String, ref: "User", required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    recordId: { type: String, default: null },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", default: null },
  },
  { timestamps: true }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ hotelId: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
