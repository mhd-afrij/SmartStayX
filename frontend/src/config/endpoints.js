const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
  },
  user: {
    base: "/api/user",
    profile: "/api/user/profile",
    recentSearches: "/api/user/store-recent-search",
  },
  rooms: {
    base: "/api/rooms",
    owner: "/api/rooms/owner",
    ownerLegacy: "/api/rooms/Owner",
    toggleAvailability: "/api/rooms/toggle-availability",
  },
  bookings: {
    base: "/api/bookings",
    user: "/api/bookings/user",
    book: "/api/bookings/book",
    hotel: (hotelId) => `/api/bookings/hotel?hotelId=${hotelId}`,
    confirmCheckout: "/api/bookings/confirm-checkout-session",
    createCheckout: "/api/bookings/create-checkout-session",
    cancel: "/api/bookings/cancel",
    modify: "/api/bookings/modify",
    pay: "/api/bookings/pay",
    paymentMethod: "/api/bookings/payment-method",
    ownerUpdatePayment: "/api/bookings/owner/update-payment",
    ownerDelete: (bookingId) => `/api/bookings/owner/${bookingId}`,
    checkAvailability: "/api/bookings/check-availability",
    calculatePrice: "/api/bookings/calculate-price",
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
  pricing: {
    suggest: "/api/pricing/suggest",
    occupancy: "/api/pricing/occupancy",
  },
  analytics: {
    bookingTrends: "/api/analytics/booking-trends",
    popularDestinations: "/api/analytics/popular-destinations",
    revenue: "/api/analytics/revenue",
    demographics: "/api/analytics/demographics",
  },
  support: {
    conversations: "/api/support/mine",
  },
  services: {
    request: "/api/services/request",
    history: "/api/services/history",
  },

  activities: {
    base: "/api/activities",
    book: "/api/activities/book",
    myBookings: "/api/activities/user/bookings",
    hotelBookings: "/api/activities/hotel/bookings",
    cancel: "/api/activities/cancel",
  },


  checkin: {
    initiate: "/api/checkin",
    approve: (id) => `/api/checkin/${id}/approve`,
    checkout: "/api/checkin/checkout",
  },
  invoice: {
    base: "/api/invoice",
    byBooking: (bookingId) => `/api/invoice/booking/${bookingId}`,
    download: (bookingId) => `/api/invoice/booking/${bookingId}/download`,
    view: (bookingId) => `/api/invoice/booking/${bookingId}/view`,
    export: "/api/invoice/export",
  },
  pricingML: {
    enhanced: "/api/pricing/ml/enhanced",
  },
  payments: {
    available: "/api/payments/available",
    create: "/api/payments/create",
    paypalCapture: "/api/payments/paypal/capture",
  },

  roomAssignment: {
    bestRoom: "/api/room-assignment/best-room",
    assign: "/api/room-assignment/assign",
  },
  guest: {
    bestValue: "/api/guest/best-value",
    cheapestDates: "/api/guest/cheapest-dates",
    priceForecast: "/api/guest/price-forecast",

  },
  guestAssistant: {
    chat: "/api/guest-assistant/chat",
    chatStream: "/api/guest-assistant/chat/stream",
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
