// googleMapsService.js — Server-side Google Maps API client (places, directions,
// geocoding). The server key lives in process.env.GOOGLE_API_KEY and is never
// exposed to the browser. The client-side map uses a separate VITE_ key.
const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";
const DIRECTIONS_BASE = "https://maps.googleapis.com/maps/api/directions/json";
const GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode/json";

const MISSING_KEY = "GOOGLE_API_KEY is not configured";

const isValidLatLng = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

const apiKey = () => process.env.GOOGLE_API_KEY;

const googleFetch = async (url) => {
  const key = apiKey();
  if (!key) throw new Error(MISSING_KEY);
  url.searchParams.set("key", key);
  const response = await fetch(url.toString());
  return response.json();
};

const extractPhotoUrl = (place) => {
  const ref = place?.photos?.[0]?.photo_reference;
  const key = apiKey();
  if (!ref || !key) return "";
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=900&photo_reference=${encodeURIComponent(ref)}&key=${encodeURIComponent(key)}`;
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

// ── Nearby discovery ─────────────────────────────────────────────────────

const CATEGORY_TYPES = {
  attractions: ["tourist_attraction"],
  restaurants: ["restaurant"],
  shopping: ["shopping_mall", "store"],
  airports: ["airport"],
  hospitals: ["hospital"],
  parks: ["park"],
  beaches: undefined,
  museums: ["museum"],
  entertainment: ["night_club", "movie_theater", "casino"],
  transport: ["transit_station", "bus_station", "train_station", "taxi_stand"],
};

const CATEGORY_KEYWORDS = { beaches: "beach" };

const fetchPlaces = async ({ type, radius, queryValue, location }) => {
  const endpoint = queryValue
    ? `${PLACES_BASE}/textsearch/json`
    : `${PLACES_BASE}/nearbysearch/json`;

  const url = new URL(endpoint);
  if (queryValue) {
    url.searchParams.set("query", queryValue);
  } else {
    url.searchParams.set("location", `${location.lat},${location.lng}`);
    url.searchParams.set("radius", String(radius));
    if (type) url.searchParams.set("type", type);
  }

  const data = await googleFetch(url);
  return Array.isArray(data.results) ? data.results.map(normalizePlace) : [];
};

export const getNearbyPlaces = async ({ lat, lng, category, radius = 15000 }) => {
  if (!isValidLatLng(lat, lng)) {
    const error = new Error("Valid hotel coordinates are required");
    error.code = "INVALID_LOCATION";
    throw error;
  }

  const key = apiKey();
  if (!key) throw new Error(MISSING_KEY);

  const cat = String(category || "").trim().toLowerCase();
  const types = CATEGORY_TYPES[cat];
  const keyword = CATEGORY_KEYWORDS[cat];
  const safeRadius = Math.min(Math.max(Number(radius) || 15000, 500), 50000);
  const location = { lat, lng };

  let places = [];
  if (types) {
    const chunks = await Promise.all(
      types.slice(0, 2).map(async (type) => fetchPlaces({ type, radius: safeRadius, location }))
    );
    const seen = new Set();
    places = chunks.flat().filter((p) => {
      if (!p.placeId || seen.has(p.placeId)) return false;
      seen.add(p.placeId);
      return true;
    });
  } else {
    places = await fetchPlaces({
      type: undefined,
      radius: safeRadius,
      queryValue: `${keyword || "tourist attractions"} near ${lat},${lng}`,
      location,
    });
  }

  return places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
};

// ── Search ───────────────────────────────────────────────────────────────

export const searchPlaces = async ({ query, lat, lng }) => {
  const q = String(query || "").trim();
  if (!q) throw new Error("A search query is required");
  const key = apiKey();
  if (!key) throw new Error(MISSING_KEY);

  const url = new URL(`${PLACES_BASE}/textsearch/json`);
  url.searchParams.set("query", q);
  // Location bias radius keeps results geographically relevant to the hotel
  // even though Places Text Search prioritizes the query string.
  if (isValidLatLng(lat, lng)) {
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("radius", "40000");
  }
  const data = await googleFetch(url);
  return Array.isArray(data.results) ? data.results.map(normalizePlace) : [];
};

// ── Directions / Routes ──────────────────────────────────────────────────

const TRAVEL_MODES = {
  DRIVE: "driving",
  WALK: "walking",
  BICYCLE: "bicycling",
  TRANSIT: "transit",
};

// Computes a route whose origin is always the supplied (DB-derived) lat/lng.
// Destination may be a Google place_id or explicit lat/lng. Returns a
// normalized SmartStayX route payload.
export const getRoute = async ({ originLat, originLng, destination, travelMode = "DRIVE" }) => {
  if (!isValidLatLng(originLat, originLng)) {
    const error = new Error("Hotel location is incomplete. Please update the hotel location.");
    error.code = "INVALID_LOCATION";
    throw error;
  }
  const key = apiKey();
  if (!key) throw new Error(MISSING_KEY);

  let dest;
  if (destination?.placeId) {
    dest = `place_id:${destination.placeId}`;
  } else if (isValidLatLng(Number(destination?.latitude), Number(destination?.longitude))) {
    dest = `${Number(destination.latitude)},${Number(destination.longitude)}`;
  } else {
    const error = new Error("A valid destination is required");
    error.code = "INVALID_DESTINATION";
    throw error;
  }

  const mode = TRAVEL_MODES[String(travelMode).toUpperCase()] || "driving";

  const url = new URL(DIRECTIONS_BASE);
  url.searchParams.set("origin", `${originLat},${originLng}`);
  url.searchParams.set("destination", dest);
  url.searchParams.set("mode", mode);
  // Transit requests may need an approximate departure/departure time; using a
  // future departure avoids "transit and walking" ambiguity errors.
  url.searchParams.set("departure_time", String(Math.floor(Date.now() / 1000) + 300));
  const data = await googleFetch(url);

  if (data.status !== "OK") {
    const error = new Error("Unable to calculate a route.");
    error.code = data.status || "NO_ROUTE";
    throw error;
  }

  const route = data.routes?.[0];
  const leg = route?.legs?.[0];
  if (!leg) {
    const error = new Error("Unable to calculate a route.");
    error.code = "NO_ROUTE";
    throw error;
  }

  return {
    origin: {
      latitude: originLat,
      longitude: originLng,
    },
    destination: {
      placeId: destination?.placeId || "",
      name: destination?.name || (destination?.latitude != null ? `${destination.latitude},${destination.longitude}` : ""),
      latitude: leg.end_location?.lat ?? null,
      longitude: leg.end_location?.lng ?? null,
    },
    distanceMeters: leg.distance?.value ?? 0,
    durationSeconds: leg.duration?.value ?? 0,
    distanceText: leg.distance?.text || "",
    durationText: leg.duration?.text || "",
    polyline: route.overview_polyline?.points || "",
    summary: route.summary || "",
    legs: (route.legs || []).map((l) => ({
      distance: { text: l.distance?.text || "", value: l.distance?.value || 0 },
      duration: { text: l.duration?.text || "", value: l.duration?.value || 0 },
      startAddress: l.start_address || "",
      endAddress: l.end_address || "",
    })),
  };
};

// ── Geocoding ────────────────────────────────────────────────────────────

// Resolves an address string (address, city, country) to coordinates.
// Returns null when the key is missing, geocoding fails, or the result has no
// geometry. Never throws for a failed lookup.
export const geocodeAddress = async ({ address, city, country }) => {
  const key = apiKey();
  if (!key) return null;

  const parts = [address, city, country].filter(Boolean).map((p) => String(p).trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const url = new URL(GEOCODE_BASE);
  url.searchParams.set("address", parts.join(", "));
  const data = await googleFetch(url);

  const result = data?.results?.[0];
  const lat = result?.geometry?.location?.lat;
  const lng = result?.geometry?.location?.lng;
  if (!isValidLatLng(lat, lng)) return null;

  return {
    latitude: lat,
    longitude: lng,
    formattedAddress: result.formatted_address || parts.join(", "),
  };
};

export default {
  getNearbyPlaces,
  searchPlaces,
  getRoute,
  geocodeAddress,
  isValidLatLng,
};