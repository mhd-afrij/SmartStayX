import TripItinerary from "../models/TripItinerary.js";
import getRedis from "../utils/redisClient.js";

// Google Places API integration: attractions, restaurants, routes, and trip itineraries.
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CACHE_TTL = 300;

const getCache = async (key) => {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const cached = await redis.get(`places:${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setCache = async (key, value) => {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`places:${key}`, JSON.stringify(value), "EX", CACHE_TTL);
  } catch {
    // best-effort
  }
};

const readQueryLocation = (query) => {
  const lat = Number(query.lat);
  const lng = Number(query.lng);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
  return {
    hasCoordinates,
    lat,
    lng,
    destination: String(query.destination || query.query || query.place || "").trim(),
  };
};

const extractPhotoUrl = (place) => {
  const ref = place?.photos?.[0]?.photo_reference;
  if (!ref || !GOOGLE_API_KEY) return "";
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=900&photo_reference=${encodeURIComponent(ref)}&key=${encodeURIComponent(GOOGLE_API_KEY)}`;
};

const normalizePlace = (place) => ({
  placeId: place.place_id,
  name: place.name,
  address: place.vicinity || place.formatted_address || "",
  rating: place.rating || 0,
  userRatingsTotal: place.user_ratings_total || 0,
  lat: place.geometry?.location?.lat,
  lng: place.geometry?.location?.lng,
  types: place.types || [],
  openNow: place.opening_hours?.open_now ?? null,
  photoUrl: extractPhotoUrl(place),
});

const fetchPlaces = async ({ type, radius, queryValue, lat, lng }) => {
  if (!GOOGLE_API_KEY) {
    return { source: "missing_key", results: [], message: "GOOGLE_API_KEY is not configured" };
  }

  const cacheKey = `${type}:${radius}:${queryValue || ""}:${lat || ""}:${lng || ""}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const endpoint = queryValue
    ? "https://maps.googleapis.com/maps/api/place/textsearch/json"
    : "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

  const params = queryValue
    ? { query: queryValue, key: GOOGLE_API_KEY }
    : { location: `${lat},${lng}`, radius, type, key: GOOGLE_API_KEY };

  const url = new URL(endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString());
  const data = await response.json();

  const payload = {
    source: "google",
    results: Array.isArray(data.results) ? data.results.map(normalizePlace) : [],
  };

  await setCache(cacheKey, payload);
  return payload;
};

export const getAttractions = async (req, res) => {
  try {
    const location = readQueryLocation(req.query);
    const queryValue = location.hasCoordinates
      ? null
      : location.destination
        ? `tourist attractions in ${location.destination}`
        : null;

    const payload = await fetchPlaces({
      type: "tourist_attraction",
      radius: 3000,
      queryValue,
      lat: location.lat,
      lng: location.lng,
    });

    res.json({
      success: payload.source === "google",
      source: payload.source,
      message: payload.message,
      attractions: payload.results,
    });
  } catch (error) {
    res.json({ success: false, message: error.message, attractions: [] });
  }
};

export const getRestaurants = async (req, res) => {
  try {
    const location = readQueryLocation(req.query);
    const queryValue = location.hasCoordinates
      ? null
      : location.destination
        ? `restaurants in ${location.destination}`
        : null;

    const payload = await fetchPlaces({
      type: "restaurant",
      radius: 2000,
      queryValue,
      lat: location.lat,
      lng: location.lng,
    });

    res.json({
      success: payload.source === "google",
      source: payload.source,
      message: payload.message,
      restaurants: payload.results,
    });
  } catch (error) {
    res.json({ success: false, message: error.message, restaurants: [] });
  }
};

export const getRoute = async (req, res) => {
  try {
    const origin = String(req.query.origin || "").trim();
    const destination = String(req.query.destination || "").trim();

    if (!origin || !destination) {
      return res.json({ success: false, message: "origin and destination are required" });
    }

    if (!GOOGLE_API_KEY) {
      return res.json({ success: false, message: "GOOGLE_API_KEY is not configured", route: null });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("key", GOOGLE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();
    const route = data?.routes?.[0] || null;

    res.json({
      success: Boolean(route),
      message: route ? "Route loaded" : data?.status || "No route found",
      route,
      routes: data?.routes || [],
    });
  } catch (error) {
    res.json({ success: false, message: error.message, route: null });
  }
};

export const getItinerary = async (req, res) => {
  try {
    const { tripId } = req.query;
    if (!tripId) {
      return res.json({ success: false, message: "tripId is required" });
    }

    const itinerary = await TripItinerary.findOne({ user: req.user._id, tripId: String(tripId) });
    res.json({ success: true, itinerary: itinerary || null });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const upsertItineraryItem = async (req, res) => {
  try {
    const {
      tripId, title, type, day = 1, address = "", notes = "",
      placeId = "", rating = 0, photoUrl = "", lat, lng,
    } = req.body;

    if (!tripId || !title || !type) {
      return res.json({ success: false, message: "tripId, title and type are required" });
    }

    const itinerary = await TripItinerary.findOneAndUpdate(
      { user: req.user._id, tripId: String(tripId) },
      {
        $setOnInsert: {
          user: req.user._id,
          tripId,
          title: `Trip ${tripId}`,
        },
        $push: {
          items: {
            type,
            title,
            address,
            day: Number(day) || 1,
            notes,
            placeId,
            rating: Number(rating) || 0,
            photoUrl,
            lat: Number.isFinite(Number(lat)) ? Number(lat) : undefined,
            lng: Number.isFinite(Number(lng)) ? Number(lng) : undefined,
          },
        },
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "Itinerary item added", itinerary });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
