import ar from './ar.js'
import en from './en.js'
import es from './es.js'
import fr from './fr.js'
import de from './de.js'
import hi from './hi.js'
import ms from './ms.js'
import zh from './zh.js'
import ta from './ta.js'
import si from './si.js'

export const locales = { ar, en, es, fr, de, hi, ms, zh, ta, si }

export const LANGUAGE_OPTIONS = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
  { code: "ms", label: "Bahasa Melayu", dir: "ltr" },
  { code: "zh", label: "简体中文", dir: "ltr" },
  { code: "ta", label: "தமிழ்", dir: "ltr" },
  { code: "si", label: "සිංහල", dir: "ltr" },
]

export const DEFAULT_LOCALE = "en"
