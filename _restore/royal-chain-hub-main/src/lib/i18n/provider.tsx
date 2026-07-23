/**
 * Locale provider (Language System).
 *
 * Wraps the app once at the root, defaulting to English. Persists the
 * user's choice, sets document.lang/dir for accessibility + RTL
 * readiness, and lazily loads only the active locale's translation file
 * (English is bundled eagerly as the guaranteed fallback).
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALES, isRtl, type LocaleCode } from "./config";
import enTranslations from "./locales/en.json";
import frTranslations from "./locales/fr.json";
import woTranslations from "./locales/wo.json";
import mnkTranslations from "./locales/mnk.json";
import ffTranslations from "./locales/ff.json";
import dyoTranslations from "./locales/dyo.json";
import srrTranslations from "./locales/srr.json";

const STORAGE_KEY = "rcw.locale";

type TranslationDict = Record<string, string>;
const FALLBACK_DICT: TranslationDict = enTranslations;

// Statically imported: the whole translation set is a few KB today. If it
// grows large enough to warrant code-splitting, swap these for
// React.lazy-friendly dynamic imports per locale.
const DICTS: Record<LocaleCode, TranslationDict> = {
  en: enTranslations,
  fr: frTranslations,
  wo: woTranslations,
  mnk: mnkTranslations,
  ff: ffTranslations,
  dyo: dyoTranslations,
  srr: srrTranslations,
};

interface LocaleContextValue {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  dict: TranslationDict;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): LocaleCode {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && stored in LOCALES ? (stored as LocaleCode) : DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
  }, [locale]);

  function setLocale(l: LocaleCode) {
    if (!LOCALES[l].releaseReady) {
      console.warn(`[i18n] Locale "${l}" is not release-ready yet (Coming Soon); ignoring.`);
      return;
    }
    setLocaleState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  }

  const dict = useMemo(() => DICTS[locale] ?? FALLBACK_DICT, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dict }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export { FALLBACK_DICT };
