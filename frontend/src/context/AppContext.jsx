import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import React from "react";
import useLocale from "../hooks/useLocale";

const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", label: "US Dollar (USD)", rate: 1 },
  { code: "EUR", symbol: "€", label: "Euro (EUR)", rate: 0.92 },
  { code: "GBP", symbol: "£", label: "Pound Sterling (GBP)", rate: 0.79 },
  { code: "AED", symbol: "د.إ", label: "Dirham (AED)", rate: 3.67 },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar (SGD)", rate: 1.35 },
  { code: "LKR", symbol: "₨", label: "Sri Lankan Rupee (LKR)", rate: 300 },
];

const normalizeCurrencyCode = (value) => {
  if (!value) return "USD";
  const upper = String(value).toUpperCase();
  if (upper === "AED" || upper === "SGD" || upper === "GBP" || upper === "USD" || upper === "LKR") return upper;
  if (value === "$") return "USD";
  return "USD";
};

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || "";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const envCurrency = normalizeCurrencyCode(import.meta.env.VITE_CURRENCY || "USD");
  const navigate = useNavigate();
  const { code: selectedLanguage, setCode: setSelectedLanguage, t: translate, languageOptions } = useLocale();
  const [selectedCurrency, setSelectedCurrency] = useState(() => normalizeCurrencyCode(localStorage.getItem("selectedCurrency") || envCurrency));
  const { isLoaded: clerkAuthLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [authLoaded, setAuthLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [dashboardAccess, setDashboardAccess] = useState("none");
  const [showHotelReg, setShowHotelReg] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [searchedCities, setSearchedCities] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [offers, setOffers] = useState([]);
  const [dashboardData, setDashboardData] = useState({ bookings: [], rooms: [], totalBookings: 0, totalRevenue: 0, occupancyPercent: 0, revenue: { today: 0, week: 0, month: 0 }, avgRating: null, upcomingBookings: 0, cancelledBookings: 0, lastMinuteBookings: 0, trends: [], hotel: null, allHotels: [] });

  const currencyConfig = useMemo(() => CURRENCY_OPTIONS.find((item) => item.code === selectedCurrency) || CURRENCY_OPTIONS[0], [selectedCurrency]);
  const currency = currencyConfig.symbol;
  const convertPrice = (amount) => Number((Number(amount || 0) * currencyConfig.rate).toFixed(2));
  const formatPrice = (amount, options = {}) => {
    const locale = selectedLanguage === "en" ? "en-US" : `${selectedLanguage}-${selectedLanguage.toUpperCase()}`;
    return new Intl.NumberFormat(locale, { style: "currency", currency: selectedCurrency, maximumFractionDigits: options.maximumFractionDigits ?? 0, minimumFractionDigits: options.minimumFractionDigits ?? 0 }).format(convertPrice(amount));
  };

  const fetchRooms = async () => { try { const { data } = await axios.get("/api/rooms", { params: { limit: 100 } }); if (data.success) setRooms(data.rooms); } catch {} };
  const fetchOffers = async () => { try { const { data } = await axios.get("/api/offers"); if (data.success) setOffers(data.offers || []); } catch {} };

  const deriveDashboardAccess = (role) => (role === "owner" ? "owner" : role === "staff" ? "receptionist" : "none");

  const syncSession = async () => {
    try {
      const { data } = await axios.get("/api/user");
      if (data.success) {
        setUser({ ...data.user, role: data.role, status: data.status });
        setDashboardAccess(data.dashboardAccess || deriveDashboardAccess(data.role));
      } else {
        setUser(null);
        setDashboardAccess("none");
      }
    } catch {
      setUser(null);
      setDashboardAccess("none");
    } finally {
      setAuthLoaded(true);
    }
  };

  const logout = async () => { await signOut(); setUser(null); setDashboardAccess("none"); navigate("/"); };

  // Attach the Clerk session token to every outgoing request so the ~29
  // `protect`-gated backend routes work without per-call header wiring.
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(async (config) => {
      if (isSignedIn) {
        const token = await getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!clerkAuthLoaded) return;
    if (isSignedIn) {
      syncSession();
    } else {
      setUser(null);
      setDashboardAccess("none");
      setAuthLoaded(true);
    }
  }, [clerkAuthLoaded, isSignedIn]);

  useEffect(() => { fetchRooms(); fetchOffers(); }, []);
  useEffect(() => { localStorage.setItem("selectedCurrency", selectedCurrency); }, [selectedCurrency]);

  const isOwner = dashboardAccess === "owner";
  const isReceptionist = dashboardAccess === "receptionist";

  const value = { currency, selectedCurrency, setSelectedCurrency, currencyOptions: CURRENCY_OPTIONS, selectedLanguage, setSelectedLanguage, languageOptions, formatPrice, convertPrice, translate, navigate, user, clerkUser, userLoaded: authLoaded, authLoaded, dashboardAccess, isOwner, isReceptionist, roleResolved: authLoaded, ownerResolved: authLoaded, showHotelReg, setShowHotelReg, selectedHotelId, setSelectedHotelId, searchedCities, setSearchedCities, rooms, setRooms, offers, setOffers, fetchOffers, refreshUser: syncSession, dashboardData, setDashboardData, axios, getToken, logout };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
};
