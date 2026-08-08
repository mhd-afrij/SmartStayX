// placesController.js — Nearby places search via external APIs
import crypto from "crypto";
import axios from "axios";
import TripItinerary from "../models/TripItinerary.js";
import { API } from "../configs/apiContracts.js";

// Google Places API integration: attractions, restaurants, routes, and trip itineraries.
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8001";
const AI_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 45000;

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

  return {
    source: "google",
    results: Array.isArray(data.results) ? data.results.map(normalizePlace) : [],
  };
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

export const geocode = async (req, res) => {
  try {
    const { place } = req.query;
    if (!place) {
      return res.json({ success: false, message: "place query param is required" });
    }
    if (!GOOGLE_API_KEY) {
      return res.json({ success: false, message: "GOOGLE_API_KEY is not configured" });
    }
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", place);
    url.searchParams.set("key", GOOGLE_API_KEY);
    const response = await fetch(url.toString());
    const data = await response.json();
    const location = data?.results?.[0]?.geometry?.location || null;
    res.json({ success: Boolean(location), location, place: data?.results?.[0]?.formatted_address || place });
  } catch (error) {
    res.json({ success: false, message: error.message, location: null });
  }
};

// ---------------------------------------------------------------------------
// Trip itinerary CRUD + AI generation
// ---------------------------------------------------------------------------

export const getItinerary = async (req, res) => {
  try {
    const { tripId } = req.query;
    if (tripId) {
      const itinerary = await TripItinerary.findOne({ user: req.user._id, tripId: String(tripId) });
      return res.json({ success: true, itinerary: itinerary || null });
    }
    const itineraries = await TripItinerary.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, itineraries });
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

export const deleteItineraryItem = async (req, res) => {
  try {
    const { tripId, itemId } = req.params;
    if (!tripId || !itemId) {
      return res.json({ success: false, message: "tripId and itemId are required" });
    }
    const itinerary = await TripItinerary.findOneAndUpdate(
      { user: req.user._id, tripId: String(tripId) },
      { $pull: { items: { _id: itemId } } },
      { new: true }
    );
    if (!itinerary) {
      return res.json({ success: false, message: "Itinerary not found" });
    }
    res.json({ success: true, message: "Itinerary item removed", itinerary });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const clearItinerary = async (req, res) => {
  try {
    const { tripId } = req.params;
    if (!tripId) {
      return res.json({ success: false, message: "tripId is required" });
    }
    const deleted = await TripItinerary.findOneAndDelete({ user: req.user._id, tripId: String(tripId) });
    res.json({ success: true, message: "Trip deleted", deleted: Boolean(deleted) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const renameTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { title } = req.body;
    if (!tripId || !title) {
      return res.json({ success: false, message: "tripId and title are required" });
    }
    const itinerary = await TripItinerary.findOneAndUpdate(
      { user: req.user._id, tripId: String(tripId) },
      { $set: { title } },
      { new: true }
    );
    if (!itinerary) {
      return res.json({ success: false, message: "Itinerary not found" });
    }
    res.json({ success: true, itinerary });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const duplicateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const source = await TripItinerary.findOne({ user: req.user._id, tripId: String(tripId) });
    if (!source) {
      return res.json({ success: false, message: "Itinerary not found" });
    }
    const newTripId = crypto.randomUUID();
    const copy = await TripItinerary.create({
      user: req.user._id,
      tripId: newTripId,
      title: `${source.title} (Copy)`,
      destination: source.destination,
      origin: source.origin,
      items: source.items.map((item) => item.toObject({ getters: false })),
    });
    res.json({ success: true, itinerary: copy });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const ACTIVITY_TYPE_BY_INTEREST = {
  beaches: "activity",
  nature: "activity",
  adventure: "activity",
  culture: "attraction",
  history: "attraction",
  food: "restaurant",
  shopping: "activity",
  nightlife: "activity",
  relaxation: "activity",
  family: "activity",
};

const dayCount = (startDate, endDate) => {
  if (!startDate || !endDate) return 3;
  const ms = new Date(endDate) - new Date(startDate);
  return Math.max(1, Math.min(21, Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1));
};

// Extracts the first well-formed JSON object/array embedded in a free-form LLM reply.
const extractJson = (text) => {
  if (!text || typeof text !== "string") return null;
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  const candidate = fencedMatch ? fencedMatch[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const openChar = candidate[start];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === openChar) depth++;
    else if (candidate[i] === closeChar) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
};

const buildItineraryPrompt = (params) => {
  const {
    destination, startDate, endDate, travelers, budget, interests,
    activityPreferences, transportPreference, foodPreference, travelPace, accessibilityRequirements,
  } = params;
  const nights = dayCount(startDate, endDate);

  return `You are a luxury travel planner. Generate a ${nights}-day trip itinerary for ${destination}.
Trip dates: ${startDate || "flexible"} to ${endDate || "flexible"}.
Travelers: ${travelers || 1}. Budget: ${budget || "not specified"}.
Interests: ${(interests || []).join(", ") || "general sightseeing"}.
Activity preferences: ${activityPreferences || "none specified"}.
Transport preference: ${transportPreference || "any"}.
Food preference: ${foodPreference || "any"}.
Travel pace: ${travelPace || "moderate"}.
Accessibility requirements: ${accessibilityRequirements || "none"}.

Respond with ONLY valid JSON (no prose, no markdown fences) in this exact shape:
{
  "title": "short trip title",
  "items": [
    {
      "day": 1,
      "type": "attraction | restaurant | activity | hotel",
      "title": "place name",
      "address": "approximate address or area",
      "notes": "1-2 sentence description including any estimated cost or duration",
      "rating": 4.5
    }
  ]
}
Include 3-4 items per day covering morning, afternoon, and evening. Keep it realistic for ${destination}.`;
};

export const generateItinerary = async (req, res) => {
  try {
    const {
      destination, startDate, endDate, travelers, budget, interests,
      activityPreferences, transportPreference, foodPreference, travelPace,
      accessibilityRequirements, tripId,
    } = req.body || {};

    if (!destination) {
      return res.status(400).json({ success: false, message: "destination is required" });
    }

    const prompt = buildItineraryPrompt({
      destination, startDate, endDate, travelers, budget, interests,
      activityPreferences, transportPreference, foodPreference, travelPace, accessibilityRequirements,
    });

    let parsed = null;
    try {
      const { data } = await axios.post(
        `${AI_SERVICE_URL}${API.ai.chat}`,
        { message: prompt, conversationId: null, language: null, languageName: null },
        { timeout: AI_TIMEOUT_MS, headers: req.user?._id ? { "user-id": req.user._id } : {} }
      );
      parsed = extractJson(data?.message || "");
    } catch (aiError) {
      return res.status(502).json({
        success: false,
        message: `AI service unavailable: ${aiError.message}`,
      });
    }

    if (!parsed || !Array.isArray(parsed.items)) {
      return res.status(502).json({
        success: false,
        message: "AI service returned an unparseable itinerary. Please try again.",
      });
    }

    const items = parsed.items.map((item) => ({
      type: String(item.type || ACTIVITY_TYPE_BY_INTEREST[(interests || [])[0]?.toLowerCase()] || "activity").toLowerCase(),
      title: String(item.title || "Untitled"),
      address: String(item.address || ""),
      day: Number(item.day) || 1,
      notes: String(item.notes || ""),
      placeId: "",
      rating: Number(item.rating) || 0,
      photoUrl: "",
      lat: undefined,
      lng: undefined,
    }));

    const finalTripId = tripId || crypto.randomUUID();
    const itinerary = await TripItinerary.findOneAndUpdate(
      { user: req.user._id, tripId: String(finalTripId) },
      {
        $set: {
          user: req.user._id,
          tripId: String(finalTripId),
          title: parsed.title || `Trip to ${destination}`,
          destination,
          items,
        },
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "Itinerary generated", itinerary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

