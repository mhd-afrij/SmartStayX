import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";
import React from "react";  

const CURRENCY_OPTIONS = [
  { code: "AED", symbol: "AED", label: "Dirham (AED)", rate: 3.67 },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar (SGD)", rate: 1.35 },
  { code: "USD", symbol: "$", label: "US Dollar (USD)", rate: 1 },
  { code: "GBP", symbol: "GBP", label: "Pound Sterling (GBP)", rate: 0.79 },
  { code: "LKR", symbol: "Rs", label: "Sri Lankan Rupee (LKR)", rate: 300 },
];

const LANGUAGE_OPTIONS = [
  { code: "ar", label: "Arabic" },
  { code: "en", label: "English" },
  { code: "ms", label: "Malay" },
  { code: "zh", label: "Mandarin" },
  { code: "ta", label: "Tamil" },
  { code: "si", label: "Sinhala" },
];

const TRANSLATIONS = {
  ar: {
    home: "الرئيسية",
    hotels: "الفنادق",
    tripPlanner: "مخطط الرحلة",
    experience: "التجارب",
    about: "حول",
    login: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    language: "اللغة",
    currency: "العملة",
    dashboard: "لوحة التحكم",
    listProperty: "أدرج عقارك",
  },
  en: {
    home: "Home",
    hotels: "Hotels",
    tripPlanner: "Trip Planner",
    experience: "Experience",
    about: "About",
    login: "Login",
    signUp: "Sign Up",
    language: "Language",
    currency: "Currency",
    dashboard: "Dashboard",
  },
  es: {
    home: "Inicio",
    hotels: "Hoteles",
    tripPlanner: "Planificador",
    experience: "Experiencias",
    about: "Acerca de",
    login: "Iniciar sesion",
    signUp: "Registrarse",
    language: "Idioma",
    currency: "Moneda",
    dashboard: "Panel",
    listProperty: "Publica tu propiedad",
  },
  fr: {
    home: "Accueil",
    hotels: "Hotels",
    tripPlanner: "Planificateur",
    experience: "Experience",
    about: "A propos",
    login: "Connexion",
    signUp: "Inscription",
    language: "Langue",
    currency: "Devise",
    dashboard: "Tableau",
    listProperty: "Inscrivez votre propriété",
  },
  de: {
    home: "Startseite",
    hotels: "Hotels",
    tripPlanner: "Reiseplaner",
    experience: "Erlebnisse",
    about: "Uber uns",
    login: "Anmelden",
    signUp: "Registrieren",
    language: "Sprache",
    currency: "Wahrung",
    dashboard: "Dashboard",
  },
  hi: {
    home: "Home",
    hotels: "Hotels",
    tripPlanner: "Trip Planner",
    experience: "Experience",
    about: "About",
    login: "Login",
    signUp: "Sign Up",
    language: "Language",
    currency: "Currency",
    dashboard: "Dashboard",
  },
  ms: {
    home: "Laman Utama",
    hotels: "Hotel",
    tripPlanner: "Perancang Perjalanan",
    experience: "Pengalaman",
    about: "Tentang",
    login: "Log Masuk",
    signUp: "Daftar",
    language: "Bahasa",
    currency: "Mata Wang",
    dashboard: "Papan Pemuka",
    listProperty: "Senaraikan properti anda",
  },
  zh: {
    home: "首页",
    hotels: "酒店",
    tripPlanner: "行程规划",
    experience: "体验",
    about: "关于",
    login: "登录",
    signUp: "注册",
    language: "语言",
    currency: "货币",
    dashboard: "仪表盘",
    listProperty: "列出您的房产",
  },
  ta: {
    home: "முகப்பு",
    hotels: "ஹோட்டல்கள்",
    tripPlanner: "பயண திட்டம்",
    experience: "அனுபவம்",
    about: "எங்களை பற்றி",
    login: "உள்நுழை",
    signUp: "பதிவு செய்ய",
    language: "மொழி",
    currency: "நாணயம்",
    dashboard: "டாஷ்போர்டு",
    listProperty: "உங்கள் சொத்தை பட்டியலிடுங்கள்",
  },
  si: {
    home: "මුල් පිටුව",
    hotels: "හෝටල්",
    tripPlanner: "ගමන් සැලසුම්කරු",
    experience: "අත්දැකීම්",
    about: "අප ගැන",
    login: "ඇතුල් වන්න",
    signUp: "ලියාපදිංචි වන්න",
    language: "භාෂාව",
    currency: "මුදල් ඒකකය",
    dashboard: "ඩැෂ්බෝඩ්",
    listProperty: "ඔබේ දේපළ ලැයිස්තුගත කරන්න",
  },
};

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

// Setting default base URL for axios
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || "";

// Creating AppContext
export const AppContext = createContext();

// AppProvider component
export const AppProvider = ({ children }) => {
  const envCurrency = normalizeCurrencyCode(import.meta.env.VITE_CURRENCY || "USD");
  const navigate = useNavigate();
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();

  const [selectedLanguage, setSelectedLanguage] = useState(
    () => localStorage.getItem("selectedLanguage") || "en"
  );
  const [selectedCurrency, setSelectedCurrency] = useState(
    () => normalizeCurrencyCode(localStorage.getItem("selectedCurrency") || envCurrency)
  );

  const [isOwner, setIsOwner] = useState(false);
  const [ownerResolved, setOwnerResolved] = useState(false);
  const [showHotelReg, setShowHotelReg] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [searchedCities, setSearchedCities] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [offers, setOffers] = useState([]);

  const currencyConfig =
    CURRENCY_OPTIONS.find((item) => item.code === selectedCurrency) || CURRENCY_OPTIONS[0];
  const currency = currencyConfig.symbol;

  const convertPrice = (amount) => {
    const base = Number(amount || 0);
    return Number((base * currencyConfig.rate).toFixed(2));
  };

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

  const translate = (key) => TRANSLATIONS[selectedLanguage]?.[key] || TRANSLATIONS.en[key] || key;

  // Fetch rooms data
  const fetchRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms");
      if (data.success) {
        setRooms(data.rooms);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

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

  // Fetch user data
  const fetchUser = async (retryCount = 0) => {
    try {
      const { data } = await axios.get("/api/user", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      console.log("User data from API:", data);
      if (data.success) {
        const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
        const effectiveOwner = data.role === "hotelOwner" || email === "mbmafrij@gmail.com";

        console.log("User role:", data.role);
        console.log("Email:", email);
        console.log("Username:", user?.username || user?.fullName);

        setIsOwner(effectiveOwner);
        console.log("IsOwner set to:", effectiveOwner);
        if (effectiveOwner) {
          console.log("✅ OWNER ACCESS GRANTED");
          console.log("Owner Email:", email);
          console.log("Owner Username:", user?.username || user?.fullName);
        }
        setSearchedCities(data.recentSearchedCities);
        setOwnerResolved(true);
      } else {
        const message = (data.message || "").toLowerCase();
        if (message.includes("not authenticated") || message.includes("user not found")) {
          setIsOwner(false);
          setSearchedCities([]);
          setOwnerResolved(true);
          return;
        }
        if (retryCount < 3) {
          setTimeout(() => {
            fetchUser(retryCount + 1); // Retry logic with max 3 retries
          }, 5000);
        } else {
          toast.error("Failed to fetch user details after multiple attempts.");
          setOwnerResolved(true);
        }
      }
    } catch (error) {
      toast.error(error.message);
      setOwnerResolved(true);
    }
  };

  useEffect(() => {
    if (user) {
      setOwnerResolved(false);
      fetchUser();
    }
  }, [user]);

  useEffect(() => {
    if (userLoaded && !user) {
      setIsOwner(false);
      setOwnerResolved(true);
      setSearchedCities([]);
    }
  }, [userLoaded, user]);

  useEffect(() => {
    fetchRooms();
    fetchOffers();
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedLanguage", selectedLanguage);
    document.documentElement.lang = selectedLanguage;
  }, [selectedLanguage]);

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
    languageOptions: LANGUAGE_OPTIONS,
    formatPrice,
    convertPrice,
    translate,
    navigate,
    user,
    userLoaded,
    getToken,
    isOwner,
    ownerResolved,
    setIsOwner,
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
