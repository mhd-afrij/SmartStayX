// securityController.js — Super Admin Security Center: login history,
// failed logins, active sessions, device/IP tracking, suspicious activity.
import SecurityEvent from "../models/SecurityEvent.js";
import User from "../models/User.js";
import securityService from "../services/securityService.js";
import { ok, badRequest, notFound } from "../utils/apiResponse.js";

const paginate = (page = 1, limit = 20) => ({
  skip: (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit))),
  limit: Math.min(100, Math.max(1, Number(limit))),
  page: Math.max(1, Number(page)),
});

export const getSecurityOverview = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [loginsToday, suspicious, failed, activeUsers] = await Promise.all([
      SecurityEvent.countDocuments({ type: "login", createdAt: { $gte: today } }),
      SecurityEvent.countDocuments({ suspicious: true }),
      SecurityEvent.countDocuments({ type: "failed_login" }),
      User.countDocuments({ status: "active", lastLoginAt: { $ne: null } }),
    ]);
    ok(res, {
      overview: {
        loginsToday,
        suspicious,
        failed,
        activeUsers,
        lastCleanedAt: null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLoginHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, from, to, ip } = req.query;
    const query = { type: "login" };
    if (search) query.$or = [{ email: { $regex: search, $options: "i" } }, { ip: { $regex: search, $options: "i" } }];
    if (ip) query.ip = ip;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    const { skip, limit: l, page: p } = paginate(page, limit);
    const [events, total] = await Promise.all([
      SecurityEvent.find(query).sort({ createdAt: -1 }).skip(skip).limit(l).populate("user", "name email image"),
      SecurityEvent.countDocuments(query),
    ]);
    ok(res, { events, total, page: p, pages: Math.ceil(total / l) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFailedLogins = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: l, page: p } = paginate(page, limit);
    const [events, total] = await Promise.all([
      SecurityEvent.find({ type: "failed_login" }).sort({ createdAt: -1 }).skip(skip).limit(l).populate("user", "name email image"),
      SecurityEvent.countDocuments({ type: "failed_login" }),
    ]);
    ok(res, { events, total, page: p });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Active sessions = most recent login per user (deduplicated).
export const getActiveSessions = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { page: p, limit: l } = paginate(page, limit);
    const sessions = await securityService.recentLoginUsers({ limit: l });

    const userIds = sessions.map((s) => s._id);
    const users = await User.find({ _id: { $in: userIds } }).select("name email image role status lastLoginAt").lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    ok(res, {
      sessions: sessions.map((s) => ({ ...s, user: userMap.get(String(s._id)) || null })),
      page: p,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Terminate a session — flags it in our records; hard revocation is delegated
// to Clerk (revokeSessions) via the stored Clerk user id.
export const revokeSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return notFound(res, "User not found");

    await SecurityEvent.create({
      type: "session_revoked",
      user: userId,
      email: user.email || "",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "",
      metadata: { revokedBy: String(req.user._id) },
      severity: "warning",
    });
    ok(res, { message: "Session flagged for revocation" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSuspiciousActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20, severity } = req.query;
    const query = { suspicious: true };
    if (severity && severity !== "all") query.severity = severity;
    const { skip, limit: l, page: p } = paginate(page, limit);
    const [events, total] = await Promise.all([
      SecurityEvent.find(query).sort({ createdAt: -1 }).skip(skip).limit(l).populate("user", "name email image"),
      SecurityEvent.countDocuments(query),
    ]);
    ok(res, { events, total, page: p });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};