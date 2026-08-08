import { useState, useEffect, useCallback, useMemo } from 'react'
import { locales, LANGUAGE_OPTIONS, DEFAULT_LOCALE } from '../locales/index.js'

function detectBrowserLanguage() {
  try {
    const raw = navigator.language || navigator.userLanguage || ''
    const code = raw.slice(0, 2)
    if (locales[code]) return code
  } catch {}
  return DEFAULT_LOCALE
}

export default function useLocale() {
  const [code, setCode] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedLanguage')
      if (saved && locales[saved]) return saved
    } catch {}
    return detectBrowserLanguage()
  })

  // Persist language selection to localStorage
  const handleSetCode = useCallback((newCode) => {
    if (locales[newCode]) {
      setCode(newCode)
      try { localStorage.setItem('selectedLanguage', newCode) } catch {}
    }
  }, [])

  const locale = useMemo(() => locales[code] || locales[DEFAULT_LOCALE], [code])

  const t = useCallback((key, params) => {
    let msg = locale.messages[key]
    if (msg === undefined) {
      msg = locales[DEFAULT_LOCALE].messages[key]
    }
    if (msg === undefined) {
      if (import.meta.env.DEV) {
        console.warn(`[useLocale] Missing key "${key}" for "${code}"`)
      }
      return key
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        msg = msg.replace(`{${k}}`, v)
      }
    }
    return msg
  }, [code, locale])

  const dir = locale.dir || 'ltr'

  useEffect(() => {
    document.documentElement.lang = code
    document.documentElement.dir = dir
  }, [code, dir])

  return {
    code,
    setCode: handleSetCode,
    t,
    dir,
    locale,
    languageOptions: LANGUAGE_OPTIONS,
  }
}
