// runAuditRetention.js — Standalone audit-log retention sweep.
// Purges AuditLog documents older than the configured retention window (default
// 1 year) EXCEPT critical modules (security, role, permission, payment,
// booking…) which are retained/archived indefinitely when archiveCritical is
// enabled. Retention is configurable by Super Admin via PlatformSettings.
//
// Usage: npm run audit-retention   (or: node scripts/runAuditRetention.js)
import "dotenv/config";
import connectDB from "../configs/db.js";
import PlatformSettings from "../models/PlatformSettings.js";
import AuditLog from "../models/AuditLog.js";

const run = async () => {
  await connectDB();

  const settings = await PlatformSettings.upsertDefaults();
  const retentionDays = settings?.auditLog?.retentionDays || 365;
  const archiveCritical = settings?.auditLog?.archiveCritical !== false;
  const criticalModules = Array.isArray(settings?.auditLog?.criticalModules) ? settings.auditLog.criticalModules : [];

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const match = { createdAt: { $lt: cutoff } };
  if (archiveCritical && criticalModules.length) match.module = { $nin: criticalModules };

  const result = await AuditLog.deleteMany(match);
  settings.auditLog.lastArchivedAt = new Date();
  await settings.save();

  console.log(
    `[audit-retention] Removed ${result.deletedCount} log(s) older than ${retentionDays}d ` +
    `(critical modules retained: ${criticalModules.join(", ") || "none"})`
  );
  process.exit(0);
};

run().catch((error) => {
  console.error("[audit-retention] Failed:", error.message);
  process.exit(1);
});