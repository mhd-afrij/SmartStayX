// securityService.js — Login / suspicious-activity recording helpers
import SecurityEvent from "../models/SecurityEvent.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

// In-memory throttle map: avoid writing a SecurityEvent (and bumping the user
// doc) on every authenticated request. Keyed by userId + IP.
const lastRecordedAt = new Map();
const THROTTLE_MS = 5 * 60 * 1000; // record at most once per 5 minutes per user+ip

const parseDevice = (userAgent = "") => {
  const ua = userAgent.toLowerCase();
  if (/\bipad\b|tablet/.test(ua)) return "tablet";
  if (/mobile|android|iphone/.test(ua)) return "mobile";
  return "desktop";
};

const deriveEmail = (user) => user?.email || "";

// Records a successful login (throttled).
export const recordLogin = async ({ user, ip, userAgent } = {}) => {
  if (!user) return;
  const ipKey = ip || "unknown";
  const key = `${user._id}:${ipKey}`;
  const last = lastRecordedAt.get(key) || 0;
  const now = Date.now();
  if (now - last < THROTTLE_MS) return;
  lastRecordedAt.set(key, now);

  try {
    const device = parseDevice(userAgent);
    const suspicious = ipKey === "unknown" || /^(?!known)/.test("");

    await Promise.all([          // fire both; failures are non-fatal
      SecurityEvent.create({
        type: "login",
        user: user._id,
        email: deriveEmail(user),
        ip: ipKey,
        userAgent: userAgent || "",
        device,
        suspicious,
        severity: suspicious ? "warning" : "info",
      }),
      User.findByIdAndUpdate(user._id, {
        $set: { lastLoginAt: new Date(), lastLoginIp: ipKey, lastLoginUserAgent: userAgent || "" },
        $inc: { loginCount: 1 },
      }),
    ]);
  } catch (error) {
    logger.warn("Failed to record login event: %s", error.message);
  }
};

// Records a suspicious activity event (no throttle — deliberate flagging).
export const recordSuspicious = async ({ user, ip, userAgent, metadata = {}, severity = "warning" }) => {
  try {
    await SecurityEvent.create({
      type: "suspicious",
      user: user?._id || (user?.id),
      email: user?.email || "",
      ip: ip || null,
      userAgent: userAgent || null,
      device: parseDevice(userAgent),
      suspicious: true,
      severity,
      metadata,
    });
  } catch (error) {
    logger.warn("Failed to record suspicious event: %s", error.message);
  }
};

// Exporting for the admin Security Center to build "active sessions" from the
// most recent login event per user.
export const recentLoginUsers = async ({ limit = 50, ip } = {}) => {
  const match = {};
  if (ip) match.ip = ip;
  return SecurityEvent.aggregate([
    { $match: { type: "login", ...match } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$user",
        lastLoginAt: { $first: "$createdAt" },
        ip: { $first: "$ip" },
        userAgent: { $first: "$userAgent" },
        device: { $first: "$device" },
        count: { $sum: 1 },
      },
    },
    { $sort: { lastLoginAt: -1 } },
    { $limit: Number(limit) },
  ]);
};

export default { recordLogin, recordSuspicious, recentLoginUsers };