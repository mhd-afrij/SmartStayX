// placesController.js — Google Places proxy: nearby places, search, geocoding, and directions.
// Powers the Trip Planner (nearby discovery, destination search, road routes + ETAs).
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";
const DIRECTIONS_BASE = "https://maps.googleapis.com/maps/api/directions/json";
const GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode/json";

const MISSING_KEY = "GOOGLE_API_KEY is not configured";

// Reads and validates lat/lng query params. Returns { ok, lat, lng }.
const readCoordinates = (query) => {
  const lat = Number(query.lat);
  const lng = Number(query.lng);
  const ok =
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  return { ok, lat, lng };
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
    return { source: "missing_key", results: [], message: MISSING_KEY };
  }

  const endpoint = queryValue
    ? `${PLACES_BASE}/textsearch/json`
    : `${PLACES_BASE}/nearbysearch/json`;

  const params = queryValue
    ? { query: queryValue, key: GOOGLE_API_KEY }
    : { location: `${lat},${lng}`, radius, type, key: GOOGLE_API_KEY };

  const url = new URL(endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString());
  const data = await response.json();

  return {
    source: "google",
    results: Array.isArray(data.results) ? data.results.map(normalizePlace) : [],
  };
};

export const getAttractions = async (req, res) => {
  try {
    const location = readCoordinates(req.query);
    const queryValue = location.ok
      ? null
      : String(req.query.destination || req.query.query || req.query.place || "")
          ? `tourist attractions in ${String(req.query.destination || req.query.query || req.query.place).trim()}`
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
    const location = readCoordinates(req.query);
    const destination = String(req.query.destination || req.query.query || req.query.place || "").trim();
    const queryValue = location.ok ? null : destination ? `restaurants in ${destination}` : null;

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

// ---------------------------------------------------------------------------
// Trip Planner endpoints
// ---------------------------------------------------------------------------

// GET /api/places/nearby?lat=&lng=&category=
// Category-driven discovery around the hotel location. Empty category returns
// a curated mix (tourist_attraction + restaurant + park) via text search.
const CATEGORY_TYPES = {
  attractions: ["tourist_attraction"],
  restaurants: ["restaurant"],
  shopping: ["shopping_mall", "store"],
  airports: ["airport"],
  hospitals: ["hospital"],
  parks: ["park"],
  beaches: undefined, // keyword based
  museums: ["museum"],
  entertainment: ["night_club", "movie_theater", "casino"],
  transport: ["transit_station", "bus_station", "train_station", "taxi_stand"],
};

const CATEGORY_KEYWORDS = {
  beaches: "beach",
};

export const getNearbyPlaces = async (req, res) => {
  try {
    const location = readCoordinates(req.query);
    if (!location.ok) {
      return res.json({ success: false, message: "Valid lat and lng query params are required", places: [] });
    }

    const category = String(req.query.category || "").trim().toLowerCase();
    const types = CATEGORY_TYPES[category];
    const keyword = CATEGORY_KEYWORDS[category] || undefined;
    const radius = Math.min(Math.max(Number(req.query.radius) || 15000, 500), 50000);

    if (!GOOGLE_API_KEY) {
      return res.json({ success: false, source: "missing_key", message: MISSING_KEY, places: [] });
    }

    let places = [];
    if (types) {
      // Split into multiple Google types when a category maps to more than one.
      const chunks = await Promise.all(
        types.slice(0, 2).map(async (type) => {
          const payload = await fetchPlaces({ type, radius, lat: location.lat, lng: location.lng });
          return payload.results;
        })
      );
      const seen = new Set();
      places = chunks.flat().filter((p) => {
        if (!p.placeId || seen.has(p.placeId)) return false;
        seen.add(p.placeId);
        return true;
      });
    } else {
      // Keyword search around the hotel (e.g. beaches) via text search with
      // a location bias — the Places text search API honors "in <area>" only,
      // so we fall back to a text query anchored to the hotel's city context.
      const payload = await fetchPlaces({
        type: undefined,
        radius,
        queryValue: `${keyword || "tourist attractions"} near ${location.lat},${location.lng}`,
        lat: location.lat,
        lng: location.lng,
      });
      places = payload.results.filter(
        (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
      );
    }

    res.json({ success: true, source: "google", category: category || "all", places });
  } catch (error) {
    res.json({ success: false, message: error.message, places: [] });
  }
};

// GET /api/places/search?query=&lat=&lng=
// Free-text destination search with optional location bias (hotel area first).
export const searchPlaces = async (req, res) => {
  try {
    const query = String(req.query.query || req.query.q || "").trim();
    if (!query) {
      return res.json({ success: false, message: "query is required", places: [] });
    }
    if (!GOOGLE_API_KEY) {
      return res.json({ success: false, source: "missing_key", message: MISSING_KEY, places: [] });
    }

    const url = new URL(`${PLACES_BASE}/textsearch/json`);
    url.searchParams.set("query", query);
    url.searchParams.set("key", GOOGLE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    const places = Array.isArray(data.results) ? data.results.map(normalizePlace) : [];
    res.json({
      success: Boolean(data.status === "OK" || data.status === "ZERO_RESULTS"),
      source: "google",
      places,
    });
  } catch (error) {
    res.json({ success: false, message: error.message, places: [] });
  }
};

// GET /api/places/reverse-geocode?lat=&lng=
// Resolves clicked map coordinates to an address.
export const reverseGeocode = async (req, res) => {
  try {
    const location = readCoordinates(req.query);
    if (!location.ok) {
      return res.json({ success: false, message: "Valid lat and lng query params are required" });
    }
    if (!GOOGLE_API_KEY) {
      return res.json({ success: false, message: MISSING_KEY });
    }

    const url = new URL(GEOCODE_BASE);
    url.searchParams.set("latlng", `${location.lat},${location.lng}`);
    url.searchParams.set("key", GOOGLE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();
    const first = data?.results?.[0] || null;

    res.json({
      success: Boolean(first),
      address: first?.formatted_address || "",
      location: first ? { lat: location.lat, lng: location.lng } : null,
    });
  } catch (error) {
    res.json({ success: false, message: error.message, address: "" });
  }
};

// GET /api/places/directions?origin=lat,lng&destination=lat,lng[&waypoint=lat,lng...]
// Road-based directions supporting up to N waypoints (Google's limit is 23).
// Returns a normalized route: legs with distance/duration text + values and
// the overview polyline for rendering.
export const getDirections = async (req, res) => {
  try {
    const origin = String(req.query.origin || "").trim();
    const destination = String(req.query.destination || "").trim();
    const waypoints = Array.isArray(req.query.waypoint)
      ? req.query.waypoint
      : req.query.waypoint
        ? [req.query.waypoint]
        : [];

    if (!origin || !destination) {
      return res.json({ success: false, message: "origin and destination are required", route: null });
    }
    if (!GOOGLE_API_KEY) {
      return res.json({ success: false, message: MISSING_KEY, route: null });
    }

    const url = new URL(DIRECTIONS_BASE);
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    if (waypoints.length > 0) {
      if (waypoints.length > 23) {
        return res.json({ success: false, message: "Too many stops for a single route", route: null });
      }
      url.searchParams.set("waypoints", `optimize:false|${waypoints.join("|")}`);
    }
    url.searchParams.set("key", GOOGLE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();
    const route = data?.routes?.[0] || null;

    if (!route) {
      const status = data?.status || "NO_ROUTE";
      const friendly =
        status === "ZERO_RESULTS"
          ? "No route is available between these locations."
          : "Unable to calculate this route.";
      return res.json({ success: false, message: friendly, status, route: null });
    }

    const legs = (route.legs || []).map((leg) => ({
      distance: { text: leg.distance?.text || "", value: leg.distance?.value || 0 },
      duration: { text: leg.duration?.text || "", value: leg.duration?.value || 0 },
      startAddress: leg.start_address || "",
      endAddress: leg.end_address || "",
      startLocation: leg.start_location || null,
      endLocation: leg.end_location || null,
    }));

    res.json({
      success: true,
      message: "Route loaded",
      route: {
        summary: route.summary || "",
        legs,
        overviewPolyline: route.overview_polyline?.points || "",
        bounds: route.bounds || null,
      },
    });
  } catch (error) {
    res.json({ success: false, message: "Unable to calculate this route.", route: null });
  }
};

// ---------------------------------------------------------------------------
// Legacy single-endpoint geocode + raw route (kept for existing consumers)
// ---------------------------------------------------------------------------

export const geocode = async (req, res) => {
  try {
    const place = req.query.place;
    if (!place) {
      return res.json({ success: false, message: "place query param is required" });
    }
    if (!GOOGLE_API_KEY) {
      return res.json({ success: false, message: MISSING_KEY });
    }
    const url = new URL(GEOCODE_BASE);
    url.searchParams.set("address", place);
    url.searchParams.set("key", GOOGLE_API_KEY);
    const response = await fetch(url.toString());
    const data = await response.json();
    const location = data?.results?.[0]?.geometry?.location || null;
    res.json({
      success: Boolean(location),
      location,
      place: data?.results?.[0]?.formatted_address || place,
    });
  } catch (error) {
    res.json({ success: false, message: error.message, location: null });
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
      return res.json({ success: false, message: MISSING_KEY, route: null });
    }

    const url = new URL(DIRECTIONS_BASE);
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
