// platformSettingsController.js — Super Admin platform configuration:
// audit retention policy, global loyalty defaults, inventory alert settings.
import PlatformSettings from "../models/PlatformSettings.js";
import AuditLog from "../models/AuditLog.js";
import { ok, badRequest, created } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

export const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    ok(res, { settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.upsertDefaults();
    const { platformName, maintenanceMode, commissionRate, currency, auditLog, loyalty, inventory } = req.body;

    if (platformName !== undefined) settings.platformName = String(platformName);
    if (maintenanceMode !== undefined) settings.maintenanceMode = !!maintenanceMode;
    if (commissionRate !== undefined) settings.commissionRate = Math.min(100, Math.max(0, Number(commissionRate)));
    if (currency !== undefined) settings.currency = String(currency);

    if (auditLog) {
      if (auditLog.retentionDays !== undefined) settings.auditLog.retentionDays = Math.min(3650, Math.max(30, Number(auditLog.retentionDays)));
      if (auditLog.archiveCritical !== undefined) settings.auditLog.archiveCritical = !!auditLog.archiveCritical;
      if (Array.isArray(auditLog.criticalModules)) settings.auditLog.criticalModules = auditLog.criticalModules.map(String);
    }

    if (loyalty) {
      if (loyalty.enabled !== undefined) settings.loyalty.enabled = !!loyalty.enabled;
      if (Array.isArray(loyalty.tiers)) {
        settings.loyalty.tiers = loyalty.tiers.map((t) => ({
          name: String(t.name),
          threshold: Math.max(0, Number(t.threshold)),
          discountPercent: Math.min(100, Math.max(0, Number(t.discountPercent) || 0)),
        }));
      }
      if (loyalty.pointsPerDollar !== undefined) settings.loyalty.pointsPerDollar = Math.max(0, Number(loyalty.pointsPerDollar));
      if (loyalty.pointsPerNight !== undefined) settings.loyalty.pointsPerNight = Math.max(0, Number(loyalty.pointsPerNight));
      if (loyalty.reviewPoints !== undefined) settings.loyalty.reviewPoints = Math.max(0, Number(loyalty.reviewPoints));
      if (loyalty.referralPoints !== undefined) settings.loyalty.referralPoints = Math.max(0, Number(loyalty.referralPoints));
    }

    if (inventory) {
      if (inventory.emailAlertsEnabled !== undefined) settings.inventory.emailAlertsEnabled = !!inventory.emailAlertsEnabled;
      if (Array.isArray(inventory.recipients)) settings.inventory.recipients = inventory.recipients.map(String).filter(Boolean);
      if (inventory.defaultLowStockThresholdPercent !== undefined) {
        settings.inventory.defaultLowStockThresholdPercent = Math.min(100, Math.max(0, Number(inventory.defaultLowStockThresholdPercent)));
      }
    }

    await settings.save();
    ok(res, { message: "Platform settings updated", settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manually run the audit-log retention sweep: purges logs older than
// retentionDays except critical modules (when archiveCritical is enabled).
export const runAuditRetention = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    const retentionDays = settings?.auditLog?.retentionDays || 365;
    const archiveCritical = settings?.auditLog?.archiveCritical !== false;
    const criticalModules = Array.isArray(settings?.auditLog?.criticalModules) ? settings.auditLog.criticalModules : [];

    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const match = { createdAt: { $lt: cutoff } };
    if (archiveCritical && criticalModules.length) match.module = { $nin: criticalModules };

    const result = await AuditLog.deleteMany(match);
    settings.auditLog.lastArchivedAt = new Date();
    await settings.save();

    logger.info("Audit retention sweep completed: removed %d logs older than %d days", result.deletedCount, retentionDays);
    ok(res, {
      message: "Audit retention sweep completed",
      deleted: result.deletedCount,
      retentionDays,
      lastArchivedAt: settings.auditLog.lastArchivedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};