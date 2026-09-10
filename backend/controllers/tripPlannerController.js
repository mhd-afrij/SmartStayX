// tripPlannerController.js — Multi-country Trip Planner API. Every origin is
// loaded from the Hotel document in the database; the frontend never supplies
// origin coordinates. Staff roles are restricted to their assigned hotel and
// guests/super_admins may use any (public/approved) hotel.
import Hotel from "../models/Hotel.js";
import { resolveManagerScope } from "../middleware/authorization.js";
import { getNearbyPlaces, searchPlaces, getRoute } from "../services/googleMapsService.js";

const VALID_LAT = (v) => Number.isFinite(v) && Math.abs(v) <= 90;
const VALID_LNG = (v) => Number.isFinite(v) && Math.abs(v) <= 180;

// Extracts validated { lat, lng } from a Hotel doc's location.coordinates,
// which are stored in GeoJSON order [lng, lat]. Returns null when incomplete.
export const hotelLocationPoint = (hotel) => {
  const coords = hotel?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) return null;
  const lng = coords[0];
  const lat = coords[1];
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!VALID_LAT(lat) || !VALID_LNG(lng)) return null;
  return { lat, lng };
};

const toHotelPayload = (hotel) => {
  const point = hotelLocationPoint(hotel);
  return {
    _id: hotel._id,
    name: hotel.name,
    address: hotel.address,
    city: hotel.city,
    country: hotel.country || "",
    currency: hotel.currency || "USD",
    timezone: hotel.timezone || "",
    location: point ? { latitude: point.lat, longitude: point.lng } : null,
  };
};

// Resolves whether the acting user may use the given hotelId. The scope
// resolver is injectable for unit tests — production always uses
// resolveManagerScope (Clerk-backed, assigned-hotel-only).
export const resolveAccess = async (req, hotelId, scopeResolver = resolveManagerScope) => {
  const role = req.user?.role;

  if (role === "super_admin") return { allowed: true, scope: null };

  if (role === "hotel_manager" || role === "receptionist") {
    const scope = await scopeResolver(req.user);
    if (!hotelId) return { allowed: Boolean(scope), scope };
    if (scope && hotelId && String(hotelId) === String(scope)) return { allowed: true, scope };
    return { allowed: false, scope: null };
  }

  // Guests and other authenticated roles may use any approved hotel.
  return { allowed: true, scope: null };
};

const fail = (res, message, extra = {}) => res.json({ success: false, message, ...extra });

// Loads the hotel the acting user is authorized to use. Attachment bodies
// (nearby/search/route) must include hotelId for staff; guests must too.
const loadAuthorizedHotel = async (req, res, hotelId) => {
  const access = await resolveAccess(req, hotelId || null);
  if (!access.allowed) {
    return { error: fail(res, "Access denied: hotel scope violation", { code: "SCOPE" }) };
  }

  let query;
  if (hotelId) query = { _id: hotelId };
  else if (req.user?.role === "super_admin") query = {};
  else if (access.scope) query = { _id: access.scope };
  else query = null;

  if (!query) {
    return { error: fail(res, "Please select a hotel to continue.", { code: "NO_HOTEL" }) };
  }

  const hotel = await Hotel.findOne(query).lean();
  if (!hotel) return { error: fail(res, "Hotel not found", { code: "NOT_FOUND" }) };

  if (req.user?.role !== "hotel_manager" && req.user?.role !== "receptionist") {
    if (hotel.approvalStatus && hotel.approvalStatus === "rejected") {
      return { error: fail(res, "Hotel is not available", { code: "UNAVAILABLE" }) };
    }
  }

  return { hotel };
};

// GET /api/trip-planner/context?hotelId=
// Returns the authorized hotel list plus the active (selected) hotel. Super
// admins and guests receive the full approved list; managers/receptionists
// receive only their assigned hotel.
export const getTripPlannerContext = async (req, res) => {
  try {
    const role = req.user?.role;
    const { hotelId } = req.query;

    let hotels;
    let selected;
    let scoped;

    if (role === "hotel_manager" || role === "receptionist") {
      const scope = await resolveManagerScope(req.user);
      if (scope) {
        hotels = await Hotel.find({ _id: scope }).lean();
        selected = hotels[0] || null;
        scoped = true;
      } else {
        hotels = [];
        selected = null;
      }
    } else {
      // super_admin and guests: full approved list.
      const filter = { approvalStatus: { $ne: "rejected" } };
      hotels = await Hotel.find(filter).sort({ createdAt: -1 }).lean();
      if (hotelId) selected = hotels.find((h) => String(h._id) === String(hotelId)) || hotels[0] || null;
      else selected = hotels[0] || null;
    }

    return res.json({
      success: true,
      role,
      scoped: Boolean(scoped),
      hotels: hotels.map(toHotelPayload),
      hotel: selected ? toHotelPayload(selected) : null,
    });
  } catch (error) {
    return fail(res, error.message);
  }
};

// GET /api/trip-planner/nearby?hotelId=&category=&radius=
export const getTripPlannerNearby = async (req, res) => {
  try {
    const { hotelId, category, radius } = req.query;
    const { hotel, error } = await loadAuthorizedHotel(req, res, hotelId);
    if (error) return error;

    const point = hotelLocationPoint(hotel);
    if (!point) {
      return fail(res, "Hotel location is incomplete. Please update the hotel location.", { code: "INVALID_LOCATION" });
    }

    const places = await getNearbyPlaces({
      lat: point.lat,
      lng: point.lng,
      category: category || "",
      radius,
    });

    return res.json({
      success: true,
      hotelId: hotel._id,
      origin: { latitude: point.lat, longitude: point.lng },
      places,
    });
  } catch (error) {
    const message = error.code === "INVALID_LOCATION" ? "Hotel location is incomplete. Please update the hotel location." : "Nearby places are temporarily unavailable.";
    return fail(res, message, { code: error.code || "NEARBY_ERROR" });
  }
};

// GET /api/trip-planner/search?hotelId=&query=
export const getTripPlannerSearch = async (req, res) => {
  try {
    const { hotelId, query } = req.query;
    const { hotel, error } = await loadAuthorizedHotel(req, res, hotelId);
    if (error) return error;

    const point = hotelLocationPoint(hotel);
    const places = await searchPlaces({
      query,
      lat: point?.lat,
      lng: point?.lng,
    });

    return res.json({ success: true, hotelId: hotel._id, places });
  } catch (error) {
    return fail(res, "Search is temporarily unavailable.", { code: error.code || "SEARCH_ERROR" });
  }
};

// POST /api/trip-planner/route
// Body: { hotelId, destination: { placeId, name, latitude, longitude }, travelMode }
// Origin always comes from the database — never from the client.
export const createTripPlannerRoute = async (req, res) => {
  try {
    const { hotelId, destination, travelMode } = req.body || {};
    const { hotel, error } = await loadAuthorizedHotel(req, res, hotelId);
    if (error) return error;

    const point = hotelLocationPoint(hotel);
    if (!point) {
      return fail(res, "Hotel location is incomplete. Please update the hotel location.", { code: "INVALID_LOCATION" });
    }

    const route = await getRoute({
      originLat: point.lat,
      originLng: point.lng,
      destination,
      travelMode,
    });

    return res.json({
      success: true,
      route: {
        ...route,
        origin: {
          hotelId: hotel._id,
          name: hotel.name,
          latitude: point.lat,
          longitude: point.lng,
        },
      },
    });
  } catch (error) {
    if (error.code === "INVALID_LOCATION" || error.code === "INVALID_DESTINATION") {
      return fail(res, error.message, { code: error.code });
    }
    return fail(res, "Unable to calculate a route. Please try another destination.", { code: error.code || "ROUTE_ERROR" });
  }
};

export const tripPlannerController = {
  getTripPlannerContext,
  getTripPlannerNearby,
  getTripPlannerSearch,
  createTripPlannerRoute,
  resolveAccess,
  hotelLocationPoint,
};