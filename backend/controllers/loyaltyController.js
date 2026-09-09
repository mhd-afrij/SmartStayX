// loyaltyController.js — Guest loyalty platform: config, points, rewards, members
import LoyaltyProgram from "../models/LoyaltyProgram.js";
import LoyaltyReward from "../models/LoyaltyReward.js";
import User from "../models/User.js";
import loyaltyService from "../services/loyaltyService.js";
import { ok, badRequest, notFound, forbidden, created } from "../utils/apiResponse.js";

// GET /api/loyalty/config?hotelId= — resolved config (global defaults ∪ hotel override)
export const getLoyaltyConfig = async (req, res) => {
  try {
    const hotelId = req.scopeHotelId || req.query.hotelId;
    const config = await loyaltyService.resolveLoyaltyConfig({ hotelId });
    ok(res, { config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/loyalty/program — manager configures a hotel override
export const upsertLoyaltyProgram = async (req, res) => {
  try {
    const hotelId = req.scopeHotelId || req.body.hotelId;
    if (!hotelId) return badRequest(res, "hotelId is required");

    const { enabled, tiers, pointsPerDollar, pointsPerNight, reviewPoints, referralPoints } = req.body;
    const update = { hotel: hotelId, enabled };
    if (Array.isArray(tiers)) {
      update.tiers = tiers.map((t) => ({ name: t.name, threshold: Number(t.threshold), discountPercent: Number(t.discountPercent) || 0 }));
    }
    // undefined → null so the service falls back to global defaults
    update.pointsPerDollar = pointsPerDollar ?? null;
    update.pointsPerNight = pointsPerNight ?? null;
    update.reviewPoints = reviewPoints ?? null;
    update.referralPoints = referralPoints ?? null;

    const program = await LoyaltyProgram.findOneAndUpdate({ hotel: hotelId }, { $set: update }, { new: true, upsert: true });
    ok(res, { message: "Loyalty program updated", program });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/loyalty/program/reset — removes the hotel override (back to global)
export const resetLoyaltyProgram = async (req, res) => {
  try {
    const hotelId = req.scopeHotelId || req.body.hotelId;
    if (!hotelId) return badRequest(res, "hotelId is required");
    await LoyaltyProgram.findOneAndDelete({ hotel: hotelId });
    ok(res, { message: "Loyalty program reset to global defaults" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/loyalty/me?hotelId= — current guest's membership
export const getMyMembership = async (req, res) => {
  try {
    const hotelId = req.scopeHotelId || req.query.hotelId;
    if (!hotelId) return badRequest(res, "hotelId is required");
    const membership = await loyaltyService.getOrCreateMembership({
      userId: String(req.user._id),
      hotelId,
    });
    const config = await loyaltyService.resolveLoyaltyConfig({ hotelId });
    const rewards = await LoyaltyReward.find({ hotel: hotelId, isActive: true }).sort({ pointsCost: 1 }).lean();
    ok(res, { membership, config: { tiers: config.tiers, enabled: config.enabled }, rewards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/loyalty/profile/:userId — manager views a guest's membership
export const getGuestProfile = async (req, res) => {
  try {
    const hotelId = req.scopeHotelId || req.query.hotelId;
    if (!hotelId) return badRequest(res, "hotelId is required");
    const membership = await loyaltyService.getOrCreateMembership({ userId: req.params.userId, hotelId });
    const user = await User.findById(req.params.userId).select("name email image role").lean();
    ok(res, { membership, guest: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/loyalty/members?hotelId=&search= — manager roster
export const listMembers = async (req, res) => {
  try {
    const hotelId = req.scopeHotelId || req.query.hotelId;
    if (!hotelId) return badRequest(res, "hotelId is required");
    const { search, page = 1, limit = 20 } = req.query;
    const query = { hotel: hotelId };
    if (search) query.user = { $in: await User.find({ $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }).select("_id").lean().then((u) => u.map((x) => x._id)) };

    const [members, total] = await Promise.all([
      LoyaltyMembership.find(query)
        .populate("user", "name email image")
        .sort({ points: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      LoyaltyMembership.countDocuments(query),
    ]);
    ok(res, { members, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/loyalty/points/earn — manager/internal manual award
export const awardPoints = async (req, res) => {
  try {
    const hotelId = req.scopeHotelId || req.body.hotelId;
    const { userId, points, reason, linkedRef } = req.body;
    if (!hotelId || !userId || !Number(points)) return badRequest(res, "hotelId, userId, and points are required");
    const result = await loyaltyService.awardPoints({
      userId,
      hotelId,
      points,
      reason: reason || "Manual adjustment",
      linkedRef,
      recordedBy: String(req.user._id),
    });
    if (!result.success) return badRequest(res, result.message);
    ok(res, { message: "Points awarded", result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/loyalty/redeem — guest redeems a reward
export const redeemReward = async (req, res) => {
  try {
    const hotelId = req.scopeHotelId || req.body.hotelId;
    const { rewardId } = req.body;
    if (!hotelId || !rewardId) return badRequest(res, "hotelId and rewardId are required");
    const result = await loyaltyService.redeemReward({
      userId: String(req.user._id),
      hotelId,
      rewardId,
    });
    if (!result.success) return badRequest(res, result.message, { required: result.required, balance: result.balance });
    ok(res, { message: result.message, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Reward catalog ─────────────────────────────────────────────────────────

export const listRewards = async (req, res) => {
  try {
    const hotelId = req.scopeHotelId || req.query.hotelId;
    if (!hotelId) return badRequest(res, "hotelId is required");
    const rewards = await LoyaltyReward.find({ hotel: hotelId }).sort({ pointsCost: 1 });
    ok(res, { rewards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReward = async (req, res) => {
  try {
    const hotelId = req.scopeHotelId || req.body.hotelId;
    if (!hotelId) return badRequest(res, "hotelId is required");
    const { title, description, pointsCost, type, value, quantityAvailable, expiresAt } = req.body;
    if (!title || !Number(pointsCost)) return badRequest(res, "title and pointsCost are required");
    const reward = await LoyaltyReward.create({
      hotel: hotelId,
      title,
      description: description || "",
      pointsCost: Number(pointsCost),
      type: type || "discount",
      value: Number(value) || 0,
      quantityAvailable: quantityAvailable === "" || quantityAvailable === null ? null : Number(quantityAvailable),
      expiresAt: expiresAt || null,
      createdBy: String(req.user._id),
    });
    created(res, { message: "Reward created", reward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const reward = await LoyaltyReward.findById(id);
    if (!reward) return notFound(res, "Reward not found");
    if (req.user.role !== "super_admin" && String(reward.hotel) !== String(req.scopeHotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }
    ["title", "description", "pointsCost", "type", "value", "quantityAvailable", "isActive", "expiresAt"].forEach((k) => {
      if (req.body[k] !== undefined) reward[k] = req.body[k];
    });
    await reward.save();
    ok(res, { message: "Reward updated", reward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReward = async (req, res) => {
  try {
    const { id } = req.params;
    const reward = await LoyaltyReward.findById(id);
    if (!reward) return notFound(res, "Reward not found");
    if (req.user.role !== "super_admin" && String(reward.hotel) !== String(req.scopeHotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }
    await reward.deleteOne();
    ok(res, { message: "Reward deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};