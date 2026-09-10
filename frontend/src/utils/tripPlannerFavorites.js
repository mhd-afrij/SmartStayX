// tripPlannerFavorites — Pure helpers for "Favorites" (in-progress feature,
// persisted per user in localStorage). Kept DOM-free so they are unit-testable.
const FAVORITES_KEY = "tripPlannerFavorites";

const keyFor = (userId) => `${FAVORITES_KEY}:${userId || "anon"}`;

export const loadFavorites = (userId) => {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveFavorites = (userId, favorites) => {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(favorites));
  } catch {
    /* storage unavailable — non-fatal */
  }
};

export const toggleFavorite = (favorites, place) => {
  const existing = favorites.some((p) => p.placeId === place.placeId);
  if (existing) return favorites.filter((p) => p.placeId !== place.placeId);
  return [
    {
      placeId: place.placeId,
      name: place.name,
      address: place.address || "",
      lat: place.lat,
      lng: place.lng,
      rating: place.rating || 0,
    },
    ...favorites,
  ];
};

export const isFavorite = (favorites, placeId) =>
  favorites.some((p) => p.placeId === placeId);