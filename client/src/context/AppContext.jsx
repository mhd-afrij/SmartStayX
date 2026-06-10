import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";
import React from "react";  

const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", label: "US Dollar (USD)", rate: 1 },
  { code: "EUR", symbol: "€", label: "Euro (EUR)", rate: 0.92 },
  { code: "GBP", symbol: "£", label: "Pound Sterling (GBP)", rate: 0.79 },
  { code: "AED", symbol: "د.إ", label: "Dirham (AED)", rate: 3.67 },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar (SGD)", rate: 1.35 },
  { code: "LKR", symbol: "₨", label: "Sri Lankan Rupee (LKR)", rate: 300 },
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
    blog: "المدونة",
    login: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    language: "اللغة",
    currency: "العملة",
    dashboard: "لوحة التحكم",
    listProperty: "أدرج عقارك",
    myBookings: "حجوزاتي",
    myBookingsSubtitle: "قم بإدارة حجوزاتك السابقة والحالية والقادمة بسهولة في مكان واحد. خطط لرحلاتك بسلاسة ببضع نقرات فقط",
    loading: "جاري تحميل حجوزاتك...",
    noBookings: "لا توجد حجوزات بعد. ابدأ الاستكشاف واحجز فندقك المفضل!",
    hotelsCol: "الفنادق",
    dateTimings: "التاريخ والتوقيت",
    payment: "الدفع",
    paid: "مدفوع",
    unpaid: "غير مدفوع",
    bookingCancelled: "الحجز ملغي",
    payWithStripe: "الدفع عبر سترايب",
    cancelBooking: "إلغاء الحجز",
    requestService: "طلب خدمة",
    checkIn: "تسجيل الوصول",
    checkOut: "تسجيل المغادرة",
    guests: "الضيوف",
    total: "المجموع",
    base: "الأساس",
    dynamic: "ديناميكي",
    surge: "زيادة",
    night: "ليلة",
    nights: "ليالي",
    method: "الطريقة",
    fetchFailed: "فشل تحميل الحجوزات",
    paymentConfirmed: "تم تأكيد الدفع بنجاح",
    paymentProcessing: "المعاملة قيد المعالجة. يرجى التحديث بعد قليل",
    confirmFailed: "تعذر تأكيد الدفع",
    stripeError: "تعذر بدء الدفع عبر سترايب",
    cancelledSuccess: "تم إلغاء الحجز بنجاح",
    cancelFailed: "تعذر إلغاء الحجز",
    processing: "جاري المعالجة...",
    cancelling: "جاري الإلغاء...",
  },
  en: {
    home: "Home",
    hotels: "Hotels",
    tripPlanner: "Trip Planner",
    experience: "Experience",
    about: "About",
    blog: "Blog",
    login: "Login",
    signUp: "Sign Up",
    language: "Language",
    currency: "Currency",
    dashboard: "Dashboard",
    myBookings: "My Bookings",
    myBookingsSubtitle: "Easily manage your past, current, and upcoming Hotel reservations in one place. Plan your trips seamlessly with just a few clicks",
    loading: "Loading your bookings...",
    noBookings: "No bookings yet. Start exploring and book your favorite hotel!",
    hotelsCol: "Hotels",
    dateTimings: "Date & Timings",
    payment: "Payment",
    paid: "Paid",
    unpaid: "UnPaid",
    bookingCancelled: "Booking Cancelled",
    payWithStripe: "Pay with Stripe",
    cancelBooking: "Cancel Booking",
    requestService: "Request Service",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    total: "Total",
    base: "Base",
    dynamic: "Dynamic",
    surge: "Surge",
    night: "night",
    nights: "nights",
    method: "Method",
    fetchFailed: "Failed to load bookings",
    paymentConfirmed: "Payment confirmed successfully",
    paymentProcessing: "Payment is processing. Please refresh in a moment.",
    confirmFailed: "Unable to confirm payment",
    stripeError: "Unable to start Stripe checkout",
    cancelledSuccess: "Booking cancelled successfully",
    cancelFailed: "Unable to cancel booking",
    processing: "Processing...",
    cancelling: "Cancelling...",
  },
  es: {
    home: "Inicio",
    hotels: "Hoteles",
    tripPlanner: "Planificador",
    experience: "Experiencias",
    about: "Acerca de",
    blog: "Blog",
    login: "Iniciar sesion",
    signUp: "Registrarse",
    language: "Idioma",
    currency: "Moneda",
    dashboard: "Panel",
    listProperty: "Publica tu propiedad",
    myBookings: "Mis Reservas",
    myBookingsSubtitle: "Administra fácilmente tus reservas pasadas, actuales y futuras en un solo lugar. Planifica tus viajes sin problemas con solo unos clics",
    loading: "Cargando tus reservas...",
    noBookings: "¡Aún no hay reservas! Comienza a explorar y reserva tu hotel favorito.",
    hotelsCol: "Hoteles",
    dateTimings: "Fecha y Horarios",
    payment: "Pago",
    paid: "Pagado",
    unpaid: "No Pagado",
    bookingCancelled: "Reserva Cancelada",
    payWithStripe: "Pagar con Stripe",
    cancelBooking: "Cancelar Reserva",
    requestService: "Solicitar Servicio",
    checkIn: "Entrada",
    checkOut: "Salida",
    guests: "Huéspedes",
    total: "Total",
    base: "Base",
    dynamic: "Dinámico",
    surge: "Incremento",
    night: "noche",
    nights: "noches",
    method: "Método",
    fetchFailed: "Error al cargar reservas",
    paymentConfirmed: "Pago confirmado exitosamente",
    paymentProcessing: "El pago está en proceso. Actualiza en un momento.",
    confirmFailed: "No se pudo confirmar el pago",
    stripeError: "No se pudo iniciar el pago con Stripe",
    cancelledSuccess: "Reserva cancelada exitosamente",
    cancelFailed: "No se pudo cancelar la reserva",
    processing: "Procesando...",
    cancelling: "Cancelando...",
  },
  fr: {
    home: "Accueil",
    hotels: "Hotels",
    tripPlanner: "Planificateur",
    experience: "Experience",
    about: "A propos",
    blog: "Blog",
    login: "Connexion",
    signUp: "Inscription",
    language: "Langue",
    currency: "Devise",
    dashboard: "Tableau",
    listProperty: "Inscrivez votre propriété",
    myBookings: "Mes Réservations",
    loading: "Chargement de vos réservations...",
    noBookings: "Pas encore de réservations. Commencez à explorer et réservez votre hôtel préféré !",
    hotelsCol: "Hôtels",
    dateTimings: "Date et Horaires",
    payment: "Paiement",
    paid: "Payé",
    unpaid: "Impayé",
    bookingCancelled: "Réservation Annulée",
    payWithStripe: "Payer avec Stripe",
    cancelBooking: "Annuler la Réservation",
    requestService: "Demander un Service",
    checkIn: "Arrivée",
    checkOut: "Départ",
    guests: "Voyageurs",
    total: "Total",
    base: "Base",
    dynamic: "Dynamique",
    surge: "Supplém.",
    night: "nuit",
    nights: "nuits",
    method: "Méthode",
    myBookingsSubtitle: "Gérez facilement vos réservations passées, actuelles et à venir en un seul endroit. Planifiez vos voyages en toute simplicité en quelques clics",
    fetchFailed: "Échec du chargement des réservations",
    paymentConfirmed: "Paiement confirmé avec succès",
    paymentProcessing: "Le paiement est en cours. Veuillez actualiser dans un instant.",
    confirmFailed: "Impossible de confirmer le paiement",
    stripeError: "Impossible de démarrer le paiement Stripe",
    cancelledSuccess: "Réservation annulée avec succès",
    cancelFailed: "Impossible d'annuler la réservation",
    processing: "Traitement...",
    cancelling: "Annulation...",
  },
  de: {
    home: "Startseite",
    hotels: "Hotels",
    tripPlanner: "Reiseplaner",
    experience: "Erlebnisse",
    about: "Uber uns",
    blog: "Blog",
    login: "Anmelden",
    signUp: "Registrieren",
    language: "Sprache",
    currency: "Wahrung",
    dashboard: "Dashboard",
    myBookings: "Meine Buchungen",
    loading: "Lade Ihre Buchungen...",
    noBookings: "Noch keine Buchungen. Entdecken Sie Hotels und buchen Sie Ihr Lieblingshotel!",
    hotelsCol: "Hotels",
    dateTimings: "Datum & Uhrzeiten",
    payment: "Zahlung",
    paid: "Bezahlt",
    unpaid: "Unbezahlt",
    bookingCancelled: "Buchung Storniert",
    payWithStripe: "Mit Stripe Zahlen",
    cancelBooking: "Buchung Stornieren",
    requestService: "Service Anfordern",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Gäste",
    total: "Gesamt",
    base: "Basis",
    dynamic: "Dynamisch",
    surge: "Aufschlag",
    night: "Nacht",
    nights: "Nächte",
    method: "Methode",
    myBookingsSubtitle: "Verwalten Sie einfach Ihre vergangenen, aktuellen und zukünftigen Hotelreservierungen an einem Ort. Planen Sie Ihre Reisen nahtlos mit nur wenigen Klicks",
    fetchFailed: "Fehler beim Laden der Buchungen",
    paymentConfirmed: "Zahlung erfolgreich bestätigt",
    paymentProcessing: "Zahlung wird verarbeitet. Bitte aktualisieren Sie gleich.",
    confirmFailed: "Zahlung konnte nicht bestätigt werden",
    stripeError: "Stripe-Checkout konnte nicht gestartet werden",
    cancelledSuccess: "Buchung erfolgreich storniert",
    cancelFailed: "Buchung konnte nicht storniert werden",
    processing: "Verarbeitung...",
    cancelling: "Stornierung...",
  },
  hi: {
    home: "होम",
    hotels: "होटल",
    tripPlanner: "यात्रा योजनाकार",
    experience: "अनुभव",
    about: "हमारे बारे में",
    blog: "ब्लॉग",
    login: "लॉग इन",
    signUp: "साइन अप",
    language: "भाषा",
    currency: "मुद्रा",
    dashboard: "डैशबोर्ड",
    myBookings: "मेरी बुकिंग",
    loading: "आपकी बुकिंग लोड हो रही है...",
    noBookings: "अभी तक कोई बुकिंग नहीं। खोजना शुरू करें और अपना पसंदीदा होटल बुक करें!",
    hotelsCol: "होटल",
    dateTimings: "तिथि और समय",
    payment: "भुगतान",
    paid: "भुगतान किया",
    unpaid: "भुगतान नहीं",
    bookingCancelled: "बुकिंग रद्द",
    payWithStripe: "स्ट्राइप से भुगतान",
    cancelBooking: "बुकिंग रद्द करें",
    requestService: "सेवा का अनुरोध",
    checkIn: "चेक-इन",
    checkOut: "चेक-आउट",
    guests: "मेहमान",
    total: "कुल",
    base: "आधार",
    dynamic: "गतिशील",
    surge: "वृद्धि",
    night: "रात",
    nights: "रातें",
    method: "तरीका",
    myBookingsSubtitle: "अपने पिछले, वर्तमान और आगामी होटल आरक्षण को एक जगह पर आसानी से प्रबंधित करें। बस कुछ क्लिक के साथ अपनी यात्राओं की सहजता से योजना बनाएं",
    fetchFailed: "बुकिंग लोड करने में विफल",
    paymentConfirmed: "भुगतान सफलतापूर्वक पुष्टि हुआ",
    paymentProcessing: "भुगतान प्रक्रिया में है। कृपया एक पल में रिफ्रेश करें।",
    confirmFailed: "भुगतान की पुष्टि करने में असमर्थ",
    stripeError: "स्ट्राइप चेकआउट शुरू करने में असमर्थ",
    cancelledSuccess: "बुकिंग सफलतापूर्वक रद्द हुई",
    cancelFailed: "बुकिंग रद्द करने में असमर्थ",
    processing: "प्रसंस्करण...",
    cancelling: "रद्द हो रहा है...",
  },
  ms: {
    home: "Laman Utama",
    hotels: "Hotel",
    tripPlanner: "Perancang Perjalanan",
    experience: "Pengalaman",
    about: "Tentang",
    blog: "Blog",
    login: "Log Masuk",
    signUp: "Daftar",
    language: "Bahasa",
    currency: "Mata Wang",
    dashboard: "Papan Pemuka",
    listProperty: "Senaraikan properti anda",
    myBookings: "Tempahan Saya",
    loading: "Memuatkan tempahan anda...",
    noBookings: "Belum ada tempahan. Mula teroka dan tempah hotel kegemaran anda!",
    hotelsCol: "Hotel",
    dateTimings: "Tarikh & Masa",
    payment: "Pembayaran",
    paid: "Dibayar",
    unpaid: "Belum Dibayar",
    bookingCancelled: "Tempahan Dibatalkan",
    payWithStripe: "Bayar dengan Stripe",
    cancelBooking: "Batal Tempahan",
    requestService: "Minta Perkhidmatan",
    checkIn: "Daftar Masuk",
    checkOut: "Daftar Keluar",
    guests: "Tamu",
    total: "Jumlah",
    base: "Asas",
    dynamic: "Dinamik",
    surge: "Lonjakan",
    night: "malam",
    nights: "malam",
    method: "Kaedah",
    myBookingsSubtitle: "Urus tempahan hotel anda yang lalu, semasa dan akan datang dengan mudah di satu tempat. Rancang perjalanan anda dengan lancar hanya dengan beberapa klik",
    fetchFailed: "Gagal memuatkan tempahan",
    paymentConfirmed: "Pembayaran berjaya disahkan",
    paymentProcessing: "Pembayaran sedang diproses. Sila muat semula sebentar lagi.",
    confirmFailed: "Tidak dapat mengesahkan pembayaran",
    stripeError: "Tidak dapat memulakan pembayaran Stripe",
    cancelledSuccess: "Tempahan berjaya dibatalkan",
    cancelFailed: "Tidak dapat membatalkan tempahan",
    processing: "Memproses...",
    cancelling: "Membatalkan...",
  },
  zh: {
    home: "首页",
    hotels: "酒店",
    tripPlanner: "行程规划",
    experience: "体验",
    about: "关于",
    blog: "博客",
    login: "登录",
    signUp: "注册",
    language: "语言",
    currency: "货币",
    dashboard: "仪表盘",
    listProperty: "列出您的房产",
    myBookings: "我的预订",
    loading: "正在加载您的预订...",
    noBookings: "暂无预订。开始探索并预订您最喜欢的酒店！",
    hotelsCol: "酒店",
    dateTimings: "日期与时间",
    payment: "付款",
    paid: "已付款",
    unpaid: "未付款",
    bookingCancelled: "预订已取消",
    payWithStripe: "使用Stripe付款",
    cancelBooking: "取消预订",
    requestService: "请求服务",
    checkIn: "入住",
    checkOut: "退房",
    guests: "住客",
    total: "总计",
    base: "基础",
    dynamic: "动态",
    surge: "附加费",
    night: "晚",
    nights: "晚",
    method: "方式",
    myBookingsSubtitle: "在一个地方轻松管理您过去、当前和未来的酒店预订。只需点击几下即可无缝规划您的旅程",
    fetchFailed: "加载预订失败",
    paymentConfirmed: "付款已成功确认",
    paymentProcessing: "付款正在处理中。请稍后刷新。",
    confirmFailed: "无法确认付款",
    stripeError: "无法启动Stripe结账",
    cancelledSuccess: "预订已成功取消",
    cancelFailed: "无法取消预订",
    processing: "处理中...",
    cancelling: "取消中...",
  },
  ta: {
    home: "முகப்பு",
    hotels: "ஹோட்டல்கள்",
    tripPlanner: "பயண திட்டம்",
    experience: "அனுபவம்",
    about: "எங்களை பற்றி",
    blog: "வலைப்பதிவு",
    login: "உள்நுழை",
    signUp: "பதிவு செய்ய",
    language: "மொழி",
    currency: "நாணயம்",
    dashboard: "டாஷ்போர்டு",
    listProperty: "உங்கள் சொத்தை பட்டியலிடுங்கள்",
    myBookings: "எனது முன்பதிவுகள்",
    loading: "உங்கள் முன்பதிவுகள் ஏற்றப்படுகின்றன...",
    noBookings: "இதுவரை முன்பதிவுகள் இல்லை. ஆராய்ந்து உங்கள் பிடித்த ஹோட்டலை முன்பதிவு செய்யுங்கள்!",
    hotelsCol: "ஹோட்டல்கள்",
    dateTimings: "தேதி மற்றும் நேரம்",
    payment: "கட்டணம்",
    paid: "செலுத்தப்பட்டது",
    unpaid: "செலுத்தப்படவில்லை",
    bookingCancelled: "முன்பதிவு ரத்து செய்யப்பட்டது",
    payWithStripe: "ஸ்ட்ரைப் மூலம் செலுத்தவும்",
    cancelBooking: "முன்பதிவை ரத்து செய்",
    requestService: "சேவையைக் கோருங்கள்",
    checkIn: "செக்-இன்",
    checkOut: "செக்-அவுட்",
    guests: "விருந்தினர்கள்",
    total: "மொத்தம்",
    base: "அடிப்படை",
    dynamic: "மாறும்",
    surge: "அதிகரிப்பு",
    night: "இரவு",
    nights: "இரவுகள்",
    method: "முறை",
    myBookingsSubtitle: "உங்கள் கடந்த, தற்போதைய மற்றும் வரவிருக்கும் ஹோட்டல் முன்பதிவுகளை ஒரே இடத்தில் எளிதாக நிர்வகிக்கவும். ஒரு சில கிளிக்குகளில் உங்கள் பயணங்களை திட்டமிடுங்கள்",
    fetchFailed: "முன்பதிவுகளை ஏற்றுவதில் தோல்வி",
    paymentConfirmed: "கட்டணம் வெற்றிகரமாக உறுதிப்படுத்தப்பட்டது",
    paymentProcessing: "கட்டணம் செயலாக்கப்படுகிறது. சிறிது நேரத்தில் புதுப்பிக்கவும்.",
    confirmFailed: "கட்டணத்தை உறுதிப்படுத்த முடியவில்லை",
    stripeError: "ஸ்ட்ரைப் செக்அவுட்டைத் தொடங்க முடியவில்லை",
    cancelledSuccess: "முன்பதிவு வெற்றிகரமாக ரத்து செய்யப்பட்டது",
    cancelFailed: "முன்பதிவை ரத்து செய்ய முடியவில்லை",
    processing: "செயலாக்குகிறது...",
    cancelling: "ரத்து செய்கிறது...",
  },
  si: {
    home: "මුල් පිටුව",
    hotels: "හෝටල්",
    tripPlanner: "ගමන් සැලසුම්කරු",
    experience: "අත්දැකීම්",
    about: "අප ගැන",
    blog: "බ්ලොග්",
    login: "ඇතුල් වන්න",
    signUp: "ලියාපදිංචි වන්න",
    language: "භාෂාව",
    currency: "මුදල් ඒකකය",
    dashboard: "ඩැෂ්බෝඩ්",
    listProperty: "ඔබේ දේපළ ලැයිස්තුගත කරන්න",
    myBookings: "මගේ වෙන්කිරීම්",
    loading: "ඔබගේ වෙන්කිරීම් පූරණය වේ...",
    noBookings: "තවම වෙන්කිරීම් නැත. ගවේෂණය කර ඔබේ ප්‍රියතම හෝටලය වෙන්කරන්න!",
    hotelsCol: "හෝටල්",
    dateTimings: "දිනය සහ වේලාව",
    payment: "ගෙවීම",
    paid: "ගෙවා ඇත",
    unpaid: "ගෙවා නැත",
    bookingCancelled: "වෙන්කිරීම අවලංගු කර ඇත",
    payWithStripe: "ස්ට්‍රයිප් සමඟ ගෙවන්න",
    cancelBooking: "වෙන්කිරීම අවලංගු කරන්න",
    requestService: "සේවාවක් ඉල්ලන්න",
    checkIn: "ඇතුල්වීම",
    checkOut: "පිටවීම",
    guests: "අමුත්තන්",
    total: "මුළු",
    base: "මූලික",
    dynamic: "ගතික",
    surge: "අධික",
    night: "රාත්‍රිය",
    nights: "රාත්‍රී",
    method: "ක්‍රමය",
    myBookingsSubtitle: "ඔබගේ අතීත, වර්තමාන සහ ඉදිරි හෝටල් වෙන්කිරීම් එක් ස්ථානයක පහසුවෙන් කළමනාකරණය කරන්න. ක්ලික් කිහිපයකින් ඔබගේ ගමන් සැලසුම් කරන්න",
    fetchFailed: "වෙන්කිරීම් පූරණය කිරීම අසාර්ථකයි",
    paymentConfirmed: "ගෙවීම සාර්ථකව තහවුරු කරන ලදී",
    paymentProcessing: "ගෙවීම සැකසෙමින් පවතී. කරුණාකර මොහොතකින් refresh කරන්න.",
    confirmFailed: "ගෙවීම තහවුරු කළ නොහැක",
    stripeError: "ස්ට්‍රයිප් චෙක්අවුට් ආරම්භ කළ නොහැක",
    cancelledSuccess: "වෙන්කිරීම සාර්ථකව අවලංගු කරන ලදී",
    cancelFailed: "වෙන්කිරීම අවලංගු කළ නොහැක",
    processing: "සැකසෙමින්...",
    cancelling: "අවලංගු කරමින්...",
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
      if (data.success) {
        const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
        const effectiveOwner = data.role === "hotelOwner" || email === "mbmafrij@gmail.com";

        setIsOwner(effectiveOwner);
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
    dashboardData,
    setDashboardData,
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
