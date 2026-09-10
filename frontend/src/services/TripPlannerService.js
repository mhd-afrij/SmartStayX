// TripPlannerService — Trip Planner API client: hotel start location, places
// discovery/search/geocoding/directions, and saved-trip CRUD.
// Uses the shared axios instance from AppContext (Clerk token attached via interceptor).
import API_ENDPOINTS from "../config/endpoints";

const CANCEL_MESSAGE = "request-cancelled";

const unwrap = (data, fallbackMessage) => {
  if (data?.success === false) {
    const error = new Error(data.message || fallbackMessage);
    error.friendly = true;
    throw error;
  }
  return data;
};

const friendly = (error, fallback) => {
  if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED" || error?.message === CANCEL_MESSAGE) {
    error.cancelled = true;
  }
  if (error?.friendly) return error;
  return new Error(error?.response?.data?.message || fallback);
};

const debounced = (fn, delay = 350) => {
  let timer = null;
  let controller = null;
  return (...args) =>
    new Promise((resolve, reject) => {
      clearTimeout(timer);
      // Cancel any in-flight request so only the latest query resolves.
      controller?.abort?.();
      controller = new AbortController();
      timer = setTimeout(() => {
        fn(...args, controller.signal).then(resolve, (error) => {
          reject(friendly(error, "Search failed"));
        });
      }, delay);
    });
};

class TripPlannerService {
  constructor() {
    this.searchDebounced = debounced((axios, query, lat, lng, signal) => {
      const params = { query };
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        params.lat = lat;
        params.lng = lng;
      }
      return axios.get(API_ENDPOINTS.places.search, {
        params,
        signal,
        headers: { "x-request-cancel": CANCEL_MESSAGE },
      });
    }, 400);
  }

  // ── Hotel start location ────────────────────────────────────────────────
  async getHotelLocation(axios, hotelId = null) {
    try {
      const { data } = await axios.get(API_ENDPOINTS.trips.hotelLocation, {
        params: hotelId ? { hotelId } : {},
      });
      return unwrap(data, "Unable to load the hotel location.");
    } catch (error) {
      if (error.friendly) throw error;
      throw friendly(error, "Unable to load the hotel location.");
    }
  }

  // ── Places ───────────────────────────────────────────────────────────────
  async getNearbyPlaces(axios, { lat, lng, category, radius }) {
    try {
      const { data } = await axios.get(API_ENDPOINTS.places.nearby, {
        params: { lat, lng, ...(category ? { category } : {}), ...(radius ? { radius } : {}) },
      });
      return unwrap(data, "Unable to find nearby places.");
    } catch (error) {
      if (error.friendly) throw error;
      throw friendly(error, "Unable to find nearby places.");
    }
  }

  searchPlaces(axios, query, lat = null, lng = null) {
    return this.searchDebounced(axios, query, lat, lng).then(({ data }) =>
      unwrap(data, "Unable to find this location.")
    );
  }

  async reverseGeocode(axios, lat, lng) {
    try {
      const { data } = await axios.get(API_ENDPOINTS.places.reverseGeocode, { params: { lat, lng } });
      return unwrap(data, "Unable to find this location.");
    } catch (error) {
      if (error.friendly) throw error;
      throw friendly(error, "Unable to find this location.");
    }
  }

  async getDirections(axios, origin, waypoints, destination) {
    try {
      const toCoordString = (p) => `${p.lat},${p.lng}`;
      const { data } = await axios.get(API_ENDPOINTS.places.directions, {
        params: {
          origin: toCoordString(origin),
          ...(waypoints?.length ? { waypoint: waypoints.map(toCoordString) } : {}),
          destination: toCoordString(destination),
        },
        paramsSerializer: {
          // axios GET arrays: repeat the key (waypoint=a&waypoint=b)
          serialize: (params) => {
            const search = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
              else if (value !== undefined && value !== null) search.append(key, value);
            });
            return search.toString();
          },
        },
      });
      return unwrap(data, "Unable to calculate this route.");
    } catch (error) {
      if (error.friendly) throw error;
      throw friendly(error, "Unable to calculate this route.");
    }
  }

  // ── Saved trips ──────────────────────────────────────────────────────────
  async getTrips(axios) {
    try {
      const { data } = await axios.get(API_ENDPOINTS.trips.base);
      return unwrap(data, "Unable to load trips.");
    } catch (error) {
      if (error.friendly) throw error;
      throw friendly(error, "Unable to load trips.");
    }
  }

  async createTrip(axios, payload) {
    try {
      const { data } = await axios.post(API_ENDPOINTS.trips.base, payload);
      return unwrap(data, "Unable to save the trip.");
    } catch (error) {
      if (error.friendly) throw error;
      throw friendly(error, "Unable to save the trip.");
    }
  }

  async updateTrip(axios, tripId, payload) {
    try {
      const { data } = await axios.put(API_ENDPOINTS.trips.trip(tripId), payload);
      return unwrap(data, "Unable to update the trip.");
    } catch (error) {
      if (error.friendly) throw error;
      throw friendly(error, "Unable to update the trip.");
    }
  }

  async deleteTrip(axios, tripId) {
    try {
      const { data } = await axios.delete(API_ENDPOINTS.trips.trip(tripId));
      return unwrap(data, "Unable to delete the trip.");
    } catch (error) {
      if (error.friendly) throw error;
      throw friendly(error, "Unable to delete the trip.");
    }
  }
}

const tripPlannerService = new TripPlannerService();
export default tripPlannerService;
export { CANCEL_MESSAGE };

