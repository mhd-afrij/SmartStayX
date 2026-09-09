// tripController.js — Trip Planner backend: hotel start location, trip CRUD, stop management.
// Authorization model: trips belong to a resolved user hotel; non-super-admins can only
// access trips of their own assigned/owned hotel (mirrors resolveManagerScope).
import Trip from "../models/Trip.js";
import Hotel from "../models/Hotel.js";
import { resolveUserHotel, isValidObjectId } from "../utils/geoUtils.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toNumberOrNull = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const validLatLng = (lat, lng) =>
  lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

// Hotel payload for the planner start card. Missing coordinates surface the
// "Hotel location is incomplete" fallback instead of fake data.
const hotelLocationPayload = (hotel) => {
  if (!hotel) {
    return {
      hotel: null,
      startLocation: null,
      locationComplete: false,
      message: "No hotel is associated with your account yet.",
    };
  }
  const coords = hotel?.location?.coordinates;
  const lng = Array.isArray(coords) ? toNumberOrNull(coords[0]) : null;
  const lat = Array.isArray(coords) ? toNumberOrNull(coords[1]) : null;
  const complete = validLatLng(lat, lng);

  return {
    hotel: {
      _id: hotel._id,
      name: hotel.name,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country || "",
    },
    startLocation: complete
      ? {
          name: hotel.name,
          address: [hotel.address, hotel.city, hotel.country].filter(Boolean).join(", "),
          lat,
          lng,
        }
      : null,
    locationComplete: complete,
    message: complete
      ? null
      : "Hotel location is incomplete. Add latitude and longitude in Hotel Management to plan trips.",
  };
};

// Loads a trip and verifies the requester is allowed to see it:
// super_admins see everything; everyone else only their resolved hotel's trips.
const loadAuthorizedTrip = async (req, tripId) => {
  if (!isValidObjectId(tripId)) return { trip: null, error: "Invalid trip id" };
  const trip = await Trip.findById(tripId).lean();
  if (!trip) return { trip: null, error: "Trip not found" };

  if (req.user.role === "super_admin") return { trip };

  const hotel = await resolveUserHotel(req.user);
  const scopeHotelId = req.user.assignedHotel
    ? String(req.user.assignedHotel)
    : hotel
      ? String(hotel._id)
      : null;

  if (!scopeHotelId || String(trip.hotel) !== scopeHotelId) {
    return { trip: null, error: "Not authorized to access this trip" };
  }
  return { trip };
};

// ---------------------------------------------------------------------------
// Hotel start location
// ---------------------------------------------------------------------------

// GET /api/trips/hotel-location
// Resolves the authenticated user's canonical hotel + start coordinates.
export const getHotelLocation = async (req, res) => {
  try {
    const requestedHotelId = req.query.hotelId || null;
    if (requestedHotelId && !isValidObjectId(String(requestedHotelId))) {
      return res.json({ success: false, message: "Invalid hotel id" });
    }
    const hotel = await resolveUserHotel(req.user, requestedHotelId ? String(requestedHotelId) : null);
    const payload = hotelLocationPayload(hotel);
    res.json({ success: true, ...payload });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load the hotel location." });
  }
};

// ---------------------------------------------------------------------------
// Trip CRUD
// ---------------------------------------------------------------------------

// GET /api/trips — list trips for the user's resolved hotel (super_admin: all).
export const getTrips = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== "super_admin") {
      const hotel = await resolveUserHotel(req.user);
      if (!hotel) return res.json({ success: true, trips: [] });
      filter.hotel = hotel._id;
    }
    const trips = await Trip.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load trips." });
  }
};

// GET /api/trips/:id
export const getTrip = async (req, res) => {
  try {
    const { trip } = await loadAuthorizedTrip(req, req.params.id);
    if (!trip) return res.json({ success: false, message: "Trip not found" });
    res.json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load the trip." });
  }
};

const normalizeStops = (rawStops) => {
  if (!Array.isArray(rawStops)) return null;
  const stops = [];
  for (const stop of rawStops) {
    const lat = toNumberOrNull(stop?.lat);
    const lng = toNumberOrNull(stop?.lng);
    if (!stop?.name || !validLatLng(lat, lng)) return null;
    stops.push({
      placeId: String(stop.placeId || ""),
      name: String(stop.name).trim().slice(0, 200),
      address: String(stop.address || "").slice(0, 500),
      category: String(stop.category || "").slice(0, 50),
      lat,
      lng,
      stopDuration: Math.max(0, Math.min(Number(stop.stopDuration) || 0, 24 * 60)),
      photoUrl: String(stop.photoUrl || "").slice(0, 1000),
      rating: Number(stop.rating) || 0,
    });
  }
  return stops;
};

// POST /api/trips — create a saved trip.
export const createTrip = async (req, res) => {
  try {
    const { name, description = "", stops = [], hotelId = null } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.json({ success: false, message: "Trip name is required" });
    }

    const normalized = normalizeStops(stops);
    if (normalized === null) {
      return res.json({ success: false, message: "Each stop needs a name and valid coordinates" });
    }

    // Resolve the hotel this trip belongs to.
    const hotel = await resolveUserHotel(req.user, hotelId ? String(hotelId) : null);
    if (!hotel) {
      return res.json({ success: false, message: "No hotel is associated with your account." });
    }

    const payload = hotelLocationPayload(hotel);
    if (!payload.locationComplete) {
      return res.json({ success: false, message: payload.message });
    }

    const trip = await Trip.create({
      hotel: hotel._id,
      owner: req.user._id,
      name: String(name).trim().slice(0, 120),
      description: String(description || "").slice(0, 500),
      startLocation: payload.startLocation,
      stops: normalized,
      status: "draft",
    });

    res.json({ success: true, message: "Trip saved", trip: trip.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to save the trip." });
  }
};

// PUT /api/trips/:id — update name/description/status/stops.
export const updateTrip = async (req, res) => {
  try {
    const { trip } = await loadAuthorizedTrip(req, req.params.id);
    if (!trip) return res.json({ success: false, message: "Trip not found" });

    const updates = {};
    if (req.body.name !== undefined) {
      if (!String(req.body.name).trim()) {
        return res.json({ success: false, message: "Trip name cannot be empty" });
      }
      updates.name = String(req.body.name).trim().slice(0, 120);
    }
    if (req.body.description !== undefined) {
      updates.description = String(req.body.description || "").slice(0, 500);
    }
    if (req.body.status !== undefined) {
      if (!["draft", "planned", "completed", "archived"].includes(req.body.status)) {
        return res.json({ success: false, message: "Invalid trip status" });
      }
      updates.status = req.body.status;
    }
    if (req.body.stops !== undefined) {
      const normalized = normalizeStops(req.body.stops);
      if (normalized === null) {
        return res.json({ success: false, message: "Each stop needs a name and valid coordinates" });
      }
      updates.stops = normalized;
    }
    if (req.body.totalDistanceKm !== undefined) {
      const d = toNumberOrNull(req.body.totalDistanceKm);
      if (d !== null && d >= 0) updates.totalDistanceKm = d;
    }
    if (req.body.totalDurationMin !== undefined) {
      const d = toNumberOrNull(req.body.totalDurationMin);
      if (d !== null && d >= 0) updates.totalDurationMin = d;
    }

    const updated = await Trip.findByIdAndUpdate(trip._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: "Trip updated", trip: updated.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to update the trip." });
  }
};

// DELETE /api/trips/:id
export const deleteTrip = async (req, res) => {
  try {
    const { trip, error } = await loadAuthorizedTrip(req, req.params.id);
    if (!trip) return res.json({ success: false, message: error || "Trip not found" });
    await Trip.findByIdAndDelete(trip._id);
    res.json({ success: true, message: "Trip deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to delete the trip." });
  }
};

// ---------------------------------------------------------------------------
// Stop management
// ---------------------------------------------------------------------------

// POST /api/trips/:id/stops — append a stop.
export const addStop = async (req, res) => {
  try {
    const { trip } = await loadAuthorizedTrip(req, req.params.id);
    if (!trip) return res.json({ success: false, message: "Trip not found" });

    const normalized = normalizeStops([req.body?.stop]);
    if (!normalized) {
      return res.json({ success: false, message: "A stop needs a name and valid coordinates" });
    }

    const updated = await Trip.findByIdAndUpdate(
      trip._id,
      { $push: { stops: normalized[0] } },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: "Stop added", trip: updated.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to add the stop." });
  }
};

// PUT /api/trips/:id/stops/:stopId — update a stop (name, duration, etc.).
export const updateStop = async (req, res) => {
  try {
    const { trip } = await loadAuthorizedTrip(req, req.params.id);
    if (!trip) return res.json({ success: false, message: "Trip not found" });

    const stop = (trip.stops || []).find((s) => String(s._id) === String(req.params.stopId));
    if (!stop) return res.json({ success: false, message: "Stop not found" });

    const set = {};
    if (req.body.name !== undefined) set["stops.$.name"] = String(req.body.name).trim().slice(0, 200);
    if (req.body.address !== undefined) set["stops.$.address"] = String(req.body.address).slice(0, 500);
    if (req.body.category !== undefined) set["stops.$.category"] = String(req.body.category).slice(0, 50);
    if (req.body.stopDuration !== undefined) {
      const d = toNumberOrNull(req.body.stopDuration);
      set["stops.$.stopDuration"] = d === null ? 0 : Math.max(0, Math.min(d, 24 * 60));
    }

    const updated = await Trip.findOneAndUpdate(
      { _id: trip._id, "stops._id": stop._id },
      { $set: set },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: "Stop updated", trip: updated.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to update the stop." });
  }
};

// DELETE /api/trips/:id/stops/:stopId
export const deleteStop = async (req, res) => {
  try {
    const { trip } = await loadAuthorizedTrip(req, req.params.id);
    if (!trip) return res.json({ success: false, message: "Trip not found" });

    const updated = await Trip.findByIdAndUpdate(
      trip._id,
      { $pull: { stops: { _id: req.params.stopId } } },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: "Stop removed", trip: updated.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to remove the stop." });
  }
};

// PUT /api/trips/:id/stops-reorder — persist a new stop order.
// Body: { order: [stopId, stopId, ...] } — must contain every stop id exactly once.
export const reorderStops = async (req, res) => {
  try {
    const { trip } = await loadAuthorizedTrip(req, req.params.id);
    if (!trip) return res.json({ success: false, message: "Trip not found" });

    const order = req.body?.order;
    if (!Array.isArray(order) || order.length !== (trip.stops || []).length) {
      return res.json({ success: false, message: "order must list every stop exactly once" });
    }

    const byId = new Map((trip.stops || []).map((s) => [String(s._id), s]));
    const reordered = [];
    for (const id of order) {
      const stop = byId.get(String(id));
      if (!stop) return res.json({ success: false, message: "order contains an unknown stop id" });
      reordered.push(stop);
      byId.delete(String(id));
    }

    const updated = await Trip.findByIdAndUpdate(
      trip._id,
      { stops: reordered },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: "Stops reordered", trip: updated.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to reorder the stops." });
  }
};
