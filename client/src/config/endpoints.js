const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
  },
  user: {
    base: "/api/user",
    profile: "/api/user/profile",
    recentSearches: "/api/user/searches",
  },
  rooms: {
    base: "/api/rooms",
    owner: "/api/rooms/owner",
    toggleAvailability: "/api/rooms/toggle-availability",
    byHotel: (hotelId) => `/api/rooms/hotel/${hotelId}`,
  },
  bookings: {
    base: "/api/bookings",
    user: "/api/bookings/user",
    hotel: (hotelId) => `/api/bookings/hotel?hotelId=${hotelId}`,
    confirmCheckout: "/api/bookings/confirm-checkout-session",
    createCheckout: "/api/bookings/create-checkout-session",
    cancel: "/api/bookings/cancel",
    modify: "/api/bookings/modify",
    ownerUpdatePayment: "/api/bookings/owner/update-payment",
    ownerDelete: (bookingId) => `/api/bookings/owner/${bookingId}`,
    checkAvailability: "/api/bookings/check-availability",
  },
  hotels: {
    base: "/api/hotels",
    owner: "/api/hotels/owner",
    all: "/api/hotels/all",
    update: (hotelId) => `/api/hotels/${hotelId}`,
  },
  offers: {
    base: "/api/offers",
    owner: "/api/offers/owner",
    update: (offerId) => `/api/offers/${offerId}`,
  },
  testimonials: {
    base: "/api/testimonials",
    owner: "/api/testimonials/owner",
    visibility: (id) => `/api/testimonials/${id}/visibility`,
    update: (id) => `/api/testimonials/${id}`,
  },
  reviews: {
    base: "/api/reviews",
    byRoom: (roomId) => `/api/reviews/room/${roomId}`,
  },
  places: {
    attractions: "/api/places/attractions",
    restaurants: "/api/places/restaurants",
  },
  routes: {
    directions: "/api/routes",
  },
  itinerary: {
    base: "/api/itinerary",
  },
  support: {
    conversations: "/api/support/conversations",
  },
  chat: {
    message: "/api/chat/message",
  },
  services: {
    request: "/api/services/request",
  },
};

export const getEndpoint = (module, key, params = {}) => {
  const endpoint = API_ENDPOINTS[module]?.[key];
  if (typeof endpoint === "function") {
    return endpoint(params);
  }
  return endpoint || "";
};

export default API_ENDPOINTS;
