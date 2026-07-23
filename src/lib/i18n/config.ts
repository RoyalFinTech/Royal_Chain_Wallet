/**
 * i18n configuration (Updated Project Information — Language System).
 *
 * English is the default and fallback. Every other locale falls back to
 * English key-by-key when a translation is missing, so partial coverage
 * never breaks the UI — it just shows English for the untranslated keys.
 * Adding a new language is one entry here + one JSON file; no application
 * code changes.
 */

export type LocaleCode = "en" | "fr" | "wo" | "mnk" | "ff" | "dyo" | "srr";

export interface LocaleMeta {
  code: LocaleCode;
  name: string; // English name, for settings lists
  nativeName: string;
  dir: "ltr" | "rtl";
  /**
   * Whether this locale has been professionally/native-speaker reviewed
   * and is safe to offer as a selectable option. Per explicit product
   * direction: Wolof, Mandinka, Fula, Jola, and Serer translation files
   * are intentionally empty (English fallback) and must NOT be enabled
   * in the language selector until reviewed — a wrong translation of
   * "Confirm"/"Send" in a wallet is a real-money risk, not a cosmetic
   * one. They remain visible but marked "Coming Soon" so the roadmap is
   * clear without exposing untranslated screens.
   */
  releaseReady: boolean;
}

export const LOCALES: Record<LocaleCode, LocaleMeta> = {
  en: { code: "en", name: "English", nativeName: "English", dir: "ltr", releaseReady: true },
  fr: { code: "fr", name: "French", nativeName: "Français", dir: "ltr", releaseReady: true },
  wo: { code: "wo", name: "Wolof", nativeName: "Wolof", dir: "ltr", releaseReady: false },
  mnk: { code: "mnk", name: "Mandinka", nativeName: "Mandinka", dir: "ltr", releaseReady: false },
  ff: { code: "ff", name: "Fula", nativeName: "Fulfulde", dir: "ltr", releaseReady: false },
  dyo: { code: "dyo", name: "Jola", nativeName: "Jola", dir: "ltr", releaseReady: false },
  srr: { code: "srr", name: "Serer", nativeName: "Seereer", dir: "ltr", releaseReady: false },
};

export const DEFAULT_LOCALE: LocaleCode = "en";
export const FALLBACK_LOCALE: LocaleCode = "en";

export function listLocales(): LocaleMeta[] {
  return Object.values(LOCALES);
}

/** Locales safe to select today — used by the language selector's active options. */
export function listSelectableLocales(): LocaleMeta[] {
  return Object.values(LOCALES).filter((l) => l.releaseReady);
}

/** Locales shown as "Coming Soon" — visible on the roadmap, not selectable. */
export function listComingSoonLocales(): LocaleMeta[] {
  return Object.values(LOCALES).filter((l) => !l.releaseReady);
}

/**
 * None of the initially supported languages are RTL, but the framework
 * (provider.tsx sets `document.dir` from this) already supports RTL
 * locales (e.g. Arabic, Hebrew) being added later with zero code changes
 * beyond one registry entry + one translation file.
 */
export function isRtl(locale: LocaleCode): boolean {
  return LOCALES[locale].dir === "rtl";
}
