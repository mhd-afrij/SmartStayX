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
  tripPlanner: {
    context: "/api/trip-planner/context",
    nearby: "/api/trip-planner/nearby",
    search: "/api/trip-planner/search",
    route: "/api/trip-planner/route",
  },
  pricing: {
    suggest: "/api/pricing/suggest",
    occupancy: "/api/pricing/occupancy",
    enhanced: "/api/pricing/ml/enhanced",
    forecast: "/api/pricing/forecast",
    suggestions: "/api/pricing/suggestions",
    predict: "/api/pricing/ml/predict",
    update: "/api/pricing/update",
  },
  attendance: {
    base: "/api/attendance",
    me: "/api/attendance/me",
    list: "/api/attendance",
    checkIn: "/api/attendance/check-in",
    checkOut: "/api/attendance/check-out",
    monthlyReport: "/api/attendance/report",
    leave: {
      request: "/api/attendance/leave",
      list: "/api/attendance/leave",
      respond: (id) => `/api/attendance/leave/${id}`,
    },
  },
  inventory: {
    base: "/api/inventory",
    items: "/api/inventory/items",
    item: (id) => `/api/inventory/items/${id}`,
    suppliers: "/api/inventory/suppliers",
    supplier: (id) => `/api/inventory/suppliers/${id}`,
    restock: (id) => `/api/inventory/items/${id}/restock`,
    stockReport: "/api/inventory/report/stock",
  },
  housekeeping: {
    base: "/api/housekeeping",
    tasks: "/api/housekeeping",
    assign: (id) => `/api/housekeeping/${id}/assign`,
    updateStatus: (id) => `/api/housekeeping/${id}/status`,
    checklist: (id) => `/api/housekeeping/${id}/checklist`,
    report: "/api/housekeeping/report",
  },
  loyalty: {
    base: "/api/loyalty",
    config: "/api/loyalty/config",
    program: "/api/loyalty/program",
    membership: "/api/loyalty/membership",
    members: "/api/loyalty/members",
    earn: "/api/loyalty/points/earn",
    redeem: "/api/loyalty/redeem",
    rewards: "/api/loyalty/rewards",
    reward: (id) => `/api/loyalty/rewards/${id}`,
  },
  security: {
    base: "/api/security",
    overview: "/api/security/overview",
    loginHistory: "/api/security/login-history",
    failedLogins: "/api/security/failed-logins",
    sessions: "/api/security/sessions",
    revoke: (id) => `/api/security/sessions/${id}/revoke`,
    suspicious: "/api/security/suspicious",
    auditLogs: "/api/admin/audit-logs",
  },
  admin: {
    base: "/api/admin",
    hotels: "/api/admin/hotels",
    approval: (id) => `/api/admin/hotels/${id}/approval`,
    documents: (id) => `/api/admin/hotels/${id}/documents`,
    reports: {
      revenue: "/api/admin/reports/revenue",
      hotelPerformance: "/api/admin/reports/hotels",
      payments: "/api/admin/payments",
    },
    settings: "/api/admin/settings",
    runRetention: "/api/admin/settings/run-audit-retention",
    activity: "/api/admin/activity",
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
