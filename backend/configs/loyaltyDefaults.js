// loyaltyDefaults.js — Global default loyalty tiers and points rules.
// Hotels can override these via their LoyaltyProgram document; the resolver
// falls back to these global defaults when no hotel-specific config exists.
export const LOYALTY_DEFAULT_TIERS = [
  { name: "Bronze", threshold: 0, discountPercent: 0 },
  { name: "Silver", threshold: 1000, discountPercent: 5 },
  { name: "Gold", threshold: 5000, discountPercent: 10 },
  { name: "Platinum", threshold: 15000, discountPercent: 15 },
];

export const LOYALTY_DEFAULTS = {
  enabled: true,
  tiers: LOYALTY_DEFAULT_TIERS,
  pointsPerDollar: 1,
  pointsPerNight: 100,
  reviewPoints: 50,
  referralPoints: 200,
  pointsPerDollarThreshold: 1, // minimum spend per point earned (e.g. 1 USD)
  currency: "USD",
};

// Resolve the tier for a given points balance against a tier list.
export const resolveTier = (points, tiers = LOYALTY_DEFAULT_TIERS) => {
  if (!Array.isArray(tiers) || !tiers.length) return { name: "Bronze", threshold: 0, discountPercent: 0 };
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  let tier = sorted[0];
  for (const t of sorted) {
    if (points >= t.threshold) tier = t;
  }
  return tier;
};