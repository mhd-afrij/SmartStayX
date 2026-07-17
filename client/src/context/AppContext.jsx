import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth, useOrganization } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";
import React from "react";
import useLocale from "../hooks/useLocale";
// Supported currencies with static exchange rates relative to USD
const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", label: "US Dollar (USD)", rate: 1 },
  { code: "EUR", symbol: "€", label: "Euro (EUR)", rate: 0.92 },
  { code: "GBP", symbol: "£", label: "Pound Sterling (GBP)", rate: 0.79 },
  { code: "AED", symbol: "د.إ", label: "Dirham (AED)", rate: 3.67 },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar (SGD)", rate: 1.35 },
  { code: "LKR", symbol: "₨", label: "Sri Lankan Rupee (LKR)", rate: 300 },
];
// Normalize various currency input formats to a standard code
const normalizeCurrencyCode = (value) => {
  if (!value) return "USD";
  if (value.toUpperCase() === "AED") return "AED";
  if (value.toUpperCase() === "SGD" || value.toUpperCase() === "S$") return "SGD";
  if (value === "$" || value.toUpperCase() === "USD") return "USD";
  if (value.toUpperCase() === "GBP") return "GBP";
  if (
    value.toUpperCase() === "LKR" ||
    value.toUpperCase() === "RS" ||
    value.toUpperCase() === "RS."
  ) {
    return "LKR";
  }
  return "USD";
};
// Set default base URL for all axios requests
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || "";
// React context holding global app state
export const AppContext = createContext();
// AppProvider — wraps children with global state: auth, currency, language, rooms, offers, dashboard
export const AppProvider = ({ children }) => {
  const envCurrency = normalizeCurrencyCode(import.meta.env.VITE_CURRENCY || "USD");
  const navigate = useNavigate();
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { code: selectedLanguage, setCode: setSelectedLanguage, t: translate, languageOptions } = useLocale();
  const [selectedCurrency, setSelectedCurrency] = useState(
    () => normalizeCurrencyCode(localStorage.getItem("selectedCurrency") || envCurrency)
  );
  const [dashboardAccess, setDashboardAccess] = useState("none");
  const [roleResolved, setRoleResolved] = useState(false);
  const orgId = organization?.id || null;
  const orgRole = organization?.role || null;
  const orgSlug = organization?.slug || null;
  const [showHotelReg, setShowHotelReg] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [searchedCities, setSearchedCities] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [offers, setOffers] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    bookings: [],
    rooms: [],
    totalBookings: 0,
    totalRevenue: 0,
    occupancyPercent: 0,
    revenue: { today: 0, week: 0, month: 0 },
    avgRating: null,
    upcomingBookings: 0,
    cancelledBookings: 0,
    lastMinuteBookings: 0,
    trends: [],
    hotel: null,
    allHotels: [],
  })
  const currencyConfig =
    CURRENCY_OPTIONS.find((item) => item.code === selectedCurrency) || CURRENCY_OPTIONS[0];
  const currency = currencyConfig.symbol;
  // Convert USD base price to the selected currency using static exchange rates
  const convertPrice = (amount) => {
    const base = Number(amount || 0);
    return Number((base * currencyConfig.rate).toFixed(2));
  };
  // Format price with locale-aware currency formatting via Intl.NumberFormat
  const formatPrice = (amount, options = {}) => {
    const locale = selectedLanguage === "en" ? "en-US" : `${selectedLanguage}-${selectedLanguage.toUpperCase()}`;
    const converted = convertPrice(amount);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: selectedCurrency,
      maximumFractionDigits: options.maximumFractionDigits ?? 0,
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
    }).format(converted);
  };
  // Fetch all available rooms for the homepage and rooms page
  const fetchRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms", { params: { limit: 100 } });
      if (data.success) {
        setRooms(data.rooms);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  // Fetch active offers/deals from the API
  const fetchOffers = async () => {
    try {
      const { data } = await axios.get("/api/offers");
      if (data.success) {
        setOffers(data.offers || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  // Derive owner/receptionist flags from dashboardAccess
  const isOwner = dashboardAccess === "owner";
  const isReceptionist = dashboardAccess === "receptionist";
  const ownerResolved = roleResolved;
  const receptionistResolved = roleResolved;

  // Fetch user data and resolve role (with retry logic)
  const fetchUser = async (retryCount = 0) => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      if (orgId) {
        headers["x-org-id"] = orgId;
        headers["x-org-role"] = orgRole;
      }
      const { data } = await axios.get("/api/user", { headers });
      if (data.success) {
        setDashboardAccess(data.dashboardAccess || "none");
        setSearchedCities(data.recentSearchedCities);
        setRoleResolved(true);
      } else {
        const message = (data.message || "").toLowerCase();
        if (message.includes("not authenticated") || message.includes("user not found") || message.includes("authentication failed")) {
          setDashboardAccess("none");
          setSearchedCities([]);
          setRoleResolved(true);
          return;
        }
        if (retryCount < 3) {
          setTimeout(() => {
            fetchUser(retryCount + 1); // Retry logic with max 3 retries
          }, 5000);
        } else {
          toast.error("Failed to fetch user details after multiple attempts.");
          setRoleResolved(true);
        }
      }
    } catch (error) {
      toast.error(error.message);
      setRoleResolved(true);
    }
  };
  // Expose refreshUser so components can re-fetch after role changes
  const refreshUser = fetchUser;

  useEffect(() => {
    if (user) {
      setRoleResolved(false);
      fetchUser();
    }
  }, [user, orgId]);
  useEffect(() => {
    if (userLoaded && !user) {
      setDashboardAccess("none");
      setRoleResolved(true);
      setSearchedCities([]);
    }
  }, [userLoaded, user]);
  useEffect(() => {
    fetchRooms();
    fetchOffers();
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedCurrency", selectedCurrency);
  }, [selectedCurrency]);
  const value = {
    currency,
    selectedCurrency,
    setSelectedCurrency,
    currencyOptions: CURRENCY_OPTIONS,
    selectedLanguage,
    setSelectedLanguage,
    languageOptions,
    formatPrice,
    convertPrice,
    translate,
    navigate,
    user,
    userLoaded,
    getToken,
    organization,
    orgId,
    orgRole,
    orgSlug,
    orgLoaded,
    dashboardAccess,
    isOwner,
    isReceptionist,
    ownerResolved,
    receptionistResolved,
    roleResolved,
    axios,
    showHotelReg,
    setShowHotelReg,
    selectedHotelId,
    setSelectedHotelId,
    searchedCities,
    setSearchedCities,
    rooms,
    setRooms,
    offers,
    setOffers,
    fetchOffers,
    refreshUser,
    dashboardData,
    setDashboardData,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
// Custom hook to access AppContext — throws if used outside AppProvider
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
