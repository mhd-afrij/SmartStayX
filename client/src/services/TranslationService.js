import { config } from "../config";

class TranslationService {
  static LANGUAGE_OPTIONS = [
    { code: "ar", label: "Arabic" },
    { code: "en", label: "English" },
    { code: "ms", label: "Malay" },
    { code: "zh", label: "Mandarin" },
    { code: "ta", label: "Tamil" },
    { code: "si", label: "Sinhala" },
  ];

  static TRANSLATIONS = {
    en: {
      home: "Home",
      hotels: "Hotels",
      experience: "Experience",
      about: "About",
      login: "Login",
      signUp: "Sign Up",
      language: "Language",
      currency: "Currency",
      dashboard: "Dashboard",
      listProperty: "List your property",
    },
    ar: {
      home: "الرئيسية",
      hotels: "الفنادق",
      experience: "التجارب",
      about: "حول",
      login: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      language: "اللغة",
      currency: "العملة",
      dashboard: "لوحة التحكم",
      listProperty: "أدرج عقارك",
    },
    ms: {
      home: "Laman Utama",
      hotels: "Hotel",
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

  #selectedLanguage;

  constructor(initialLanguage) {
    const configured = config.get("ui.defaultLanguage", "en");
    this.#selectedLanguage =
      TranslationService.TRANSLATIONS[initialLanguage]
        ? initialLanguage
        : configured;
  }

  get selectedLanguage() {
    return this.#selectedLanguage;
  }

  get options() {
    return TranslationService.LANGUAGE_OPTIONS;
  }

  setLanguage(code) {
    if (TranslationService.TRANSLATIONS[code]) {
      this.#selectedLanguage = code;
    }
  }

  translate(key) {
    return (
      TranslationService.TRANSLATIONS[this.#selectedLanguage]?.[key] ||
      TranslationService.TRANSLATIONS.en[key] ||
      key
    );
  }

  getAvailableLanguages() {
    return Object.keys(TranslationService.TRANSLATIONS);
  }
}

export default TranslationService;
