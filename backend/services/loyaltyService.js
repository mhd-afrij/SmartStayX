// loyaltyService.js — Loyalty engine: config resolution, point accrual,
// tier resolution, and redemption. Hotels override the global defaults; when
// no LoyaltyProgram doc exists the global defaults (PlatformSettings /
// configs/loyaltyDefaults.js) are used.
import LoyaltyProgram from "../models/LoyaltyProgram.js";
import LoyaltyMembership from "../models/LoyaltyMembership.js";
import LoyaltyReward from "../models/LoyaltyReward.js";
import PlatformSettings from "../models/PlatformSettings.js";
import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import { LOYALTY_DEFAULTS, resolveTier } from "../configs/loyaltyDefaults.js";

// Resolve effective loyalty config for a hotel (global defaults ∪ hotel override)
export const resolveLoyaltyConfig = async ({ hotelId } = {}) => {
  const settings = await PlatformSettings.getSettings();
  const global = settings?.loyalty || LOYALTY_DEFAULTS;

  let hotelProgram = null;
  if (hotelId) {
    hotelProgram = await LoyaltyProgram.findOne({ hotel: hotelId }).lean().catch(() => null);
  }

  const pick = (overrideVal, defaultVal) => (overrideVal !== null && overrideVal !== undefined ? overrideVal : defaultVal);

  return {
    enabled: hotelProgram ? hotelProgram.enabled !== false && global.enabled !== false : global.enabled !== false,
    tiers: hotelProgram?.tiers?.length ? hotelProgram.tiers : (global.tiers || LOYALTY_DEFAULTS.tiers),
    pointsPerDollar: pick(hotelProgram?.pointsPerDollar, global.pointsPerDollar ?? LOYALTY_DEFAULTS.pointsPerDollar),
    pointsPerNight: pick(hotelProgram?.pointsPerNight, global.pointsPerNight ?? LOYALTY_DEFAULTS.pointsPerNight),
    reviewPoints: pick(hotelProgram?.reviewPoints, global.reviewPoints ?? LOYALTY_DEFAULTS.reviewPoints),
    referralPoints: pick(hotelProgram?.referralPoints, global.referralPoints ?? LOYALTY_DEFAULTS.referralPoints),
    source: hotelProgram ? "hotel" : "global",
  };
};

// Resolve a membership's tier from its point balance.
export const tierForPoints = async (points, hotelId) => {
  const config = await resolveLoyaltyConfig({ hotelId });
  return resolveTier(points, config.tiers);
};

export const getOrCreateMembership = async ({ userId, hotelId, config }) => {
  if (!userId || !hotelId) return null;
  let membership = await LoyaltyMembership.findOne({ user: userId, hotel: hotelId });
  if (!membership) {
    const cfg = config || (await resolveLoyaltyConfig({ hotelId }));
    membership = await LoyaltyMembership.create({
      user: userId,
      hotel: hotelId,
      points: 0,
      tier: resolveTier(0, cfg.tiers).name,
    });
  }
  return membership;
};

// Recompute tier + refresh lifetime stats after a points change.
const refreshMembership = async (membership, cfg) => {
  const tier = resolveTier(membership.points, cfg.tiers);
  membership.tier = tier.name;
  membership.lastActivityAt = new Date();
  await membership.save();
  return { membership, tier };
};

// Award points with a reason and linked reference.
export const awardPoints = async ({ userId, hotelId, points, reason, linkedRef, recordedBy }) => {
  if (!Number(points) || Number(points) <= 0) return { success: false, message: "points must be positive" };
  const config = await resolveLoyaltyConfig({ hotelId });
  if (!config.enabled) return { success: false, message: "Loyalty program disabled" };

  const membership = await getOrCreateMembership({ userId, hotelId, config });
  if (!membership) return { success: false, message: "Membership could not be created" };

  membership.points += Math.round(Number(points));
  membership.history.push({
    type: "earn",
    points: Math.round(Number(points)),
    reason: reason || "Points earned",
    linkedRef: linkedRef || null,
    recordedBy: recordedBy || null,
  });
  const { membership: saved, tier } = await refreshMembership(membership, config);
  return { success: true, points: saved.points, tier: tier.name, awarded: Math.round(Number(points)) };
};

// Award booking points (called by the booking lifecycle after payment).
export const awardBookingPoints = async ({ booking }) => {
  if (!booking?.user || !booking?.hotel) return { success: false };
  const config = await resolveLoyaltyConfig({ hotelId: booking.hotel });
  if (!config.enabled) return { success: false };

  const spend = Number(booking.totalPrice) || 0;
  const nights = Number(booking.nights) || 1;
  const pointsFromSpend = Math.round((spend * config.pointsPerDollar) / (config.pointsPerDollarThreshold || LOYALTY_DEFAULTS.pointsPerDollarThreshold));
  const pointsFromNights = Math.round(nights * (config.pointsPerNight || 0));
  const total = pointsFromSpend + pointsFromNights;
  if (total <= 0) return { success: false };

  const result = await awardPoints({
    userId: booking.user,
    hotelId: booking.hotel,
    points: total,
    reason: `Stay reward — ${nights} night(s)`,
    linkedRef: `booking:${booking._id}`,
  });

  if (result.success) {
    const updated = await getOrCreateMembership({ userId: booking.user, hotelId: booking.hotel });
    updated.totalStays += 1;
    updated.lifetimeSpend += spend;
    await updated.save();
    await User.findByIdAndUpdate(booking.user, { $inc: { "loyalty.totalStays": 1, "loyalty.lifetimeSpend": spend } }).catch(() => {});
  }
  return result;
};

// Award review points.
export const awardReviewPoints = async ({ userId, hotelId }) => {
  const config = await resolveLoyaltyConfig({ hotelId });
  if (!config.enabled || !config.reviewPoints) return { success: false };
  return awardPoints({
    userId,
    hotelId,
    points: config.reviewPoints,
    reason: "Review submitted",
    linkedRef: "review",
  });
};

// Redeem a reward from the catalog.
export const redeemReward = async ({ userId, hotelId, rewardId }) => {
  const config = await resolveLoyaltyConfig({ hotelId });
  if (!config.enabled) return { success: false, message: "Loyalty program disabled" };

  const reward = await LoyaltyReward.findById(rewardId);
  if (!reward || String(reward.hotel) !== String(hotelId)) {
    return { success: false, message: "Reward not found" };
  }
  if (!reward.isActive) return { success: false, message: "Reward is inactive" };

  const membership = await getOrCreateMembership({ userId, hotelId, config });
  if (membership.points < reward.pointsCost) {
    return { success: false, message: "Insufficient points", required: reward.pointsCost, balance: membership.points };
  }

  // Decrement inventory if limited.
  if (Number.isFinite(reward.quantityAvailable)) {
    if (reward.quantityAvailable <= 0) return { success: false, message: "Reward out of stock" };
    reward.quantityAvailable -= 1;
    if (reward.quantityAvailable === 0) reward.isActive = false;
    await reward.save();
  }

  membership.points -= reward.pointsCost;
  membership.history.push({
    type: "redeem",
    points: -reward.pointsCost,
    reason: `Redeemed ${reward.title}`,
    linkedRef: `reward:${rewardId}`,
  });
  await refreshMembership(membership, config);

  return {
    success: true,
    message: "Reward redeemed",
    reward,
    remainingPoints: membership.points,
    tier: membership.tier,
  };
};

// Daily referrals increment.
export const recordReferral = async ({ userId, referredUserId, hotelId }) => {
  const config = await resolveLoyaltyConfig({ hotelId });
  if (!config.enabled || !config.referralPoints) return { success: false };
  const result = await awardPoints({
    userId: userId,
    hotelId,
    points: config.referralPoints,
    reason: "Referral",
    linkedRef: `user:${referredUserId}`,
  });
  if (result.success) {
    await getOrCreateMembership({ userId, hotelId }).then((m) => {
      m.referralsCount += 1;
      return m.save();
    });
  }
  return result;
};

export default {
  resolveLoyaltyConfig,
  awardPoints,
  awardBookingPoints,
  awardReviewPoints,
  redeemReward,
  getOrCreateMembership,
  tierForPoints,
  recordReferral,
};