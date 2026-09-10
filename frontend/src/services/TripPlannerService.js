// TripPlannerService — Client for the /api/trip-planner provenance-tagged API.
// Origin coordinates always come from the backend (Hotel database), never from
// the browser. Uses the shared axios instance whose request interceptor
// auto-attaches the Clerk Bearer token when signed in.
import axios from "axios";
import API_ENDPOINTS from "../config/endpoints";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

const withBase = (url) => (url.startsWith("http") ? url : `${API_BASE_URL}${url}`);

const unwrap = (data) => {
  if (data?.success === false) {
    const error = new Error(data.message || "Trip Planner request failed");
    error.code = data.code;
    throw error;
  }
  return data;
};

const requestError = (error) => {
  const message = error.response?.data?.message || error.message;
  const code = error.response?.data?.code || error.code;
  const wrapped = new Error(message);
  wrapped.code = code;
  wrapped.status = error.response?.status;
  throw wrapped;
};

const getContext = async (hotelId) => {
  try {
    const params = hotelId ? { hotelId } : {};
    const response = await axios.get(withBase(API_ENDPOINTS.tripPlanner.context), { params, timeout: API_TIMEOUT });
    return unwrap(response.data);
  } catch (error) {
    requestError(error);
  }
};

const getNearby = async ({ hotelId, category, radius }) => {
  try {
    const response = await axios.get(withBase(API_ENDPOINTS.tripPlanner.nearby), {
      params: { hotelId, category, radius },
      timeout: API_TIMEOUT,
    });
    return unwrap(response.data);
  } catch (error) {
    requestError(error);
  }
};

const search = async ({ hotelId, query }) => {
  try {
    const response = await axios.get(withBase(API_ENDPOINTS.tripPlanner.search), {
      params: { hotelId, query },
      timeout: API_TIMEOUT,
    });
    return unwrap(response.data);
  } catch (error) {
    requestError(error);
  }
};

const getRoute = async ({ hotelId, destination, travelMode }) => {
  try {
    const response = await axios.post(withBase(API_ENDPOINTS.tripPlanner.route), { hotelId, destination, travelMode }, { timeout: API_TIMEOUT });
    return unwrap(response.data);
  } catch (error) {
    requestError(error);
  }
};

export const TripPlannerService = {
  getContext,
  getNearby,
  search,
  getRoute,
};

export default TripPlannerService;