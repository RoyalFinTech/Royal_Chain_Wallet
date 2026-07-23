/**
 * Locale-aware formatting (Language System).
 * Thin wrappers over Intl.* so number/date/currency formatting follows
 * the user's chosen locale rather than a hardcoded region.
 */
import type { LocaleCode } from "./config";

// BCP-47 tags for Intl — our internal codes map 1:1 except Fula, which
// uses the "ff" ISO-639-1 code recognized by most Intl implementations.
const INTL_TAG: Record<LocaleCode, string> = {
  en: "en-US",
  fr: "fr-FR",
  wo: "wo-SN",
  mnk: "en-GM" /* no widely supported Intl locale yet */,
  ff: "ff-Latn",
  dyo: "en-GM" /* no widely supported Intl locale yet */,
  srr: "en-GM" /* no widely supported Intl locale yet */,
};

function tag(locale: LocaleCode): string {
  return INTL_TAG[locale] ?? "en-US";
}

export function formatNumber(
  value: number,
  locale: LocaleCode,
  opts?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(tag(locale), opts).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", opts).format(value);
  }
}

export function formatCurrencyAmount(
  value: number,
  currencyCode: string,
  locale: LocaleCode,
): string {
  try {
    return new Intl.NumberFormat(tag(locale), { style: "currency", currency: currencyCode }).format(
      value,
    );
  } catch {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(
      value,
    );
  }
}

export function formatDate(
  date: Date | number,
  locale: LocaleCode,
  opts?: Intl.DateTimeFormatOptions,
): string {
  try {
    return new Intl.DateTimeFormat(tag(locale), opts).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", opts).format(date);
  }
}

export function formatRelativeTime(msFromNow: number, locale: LocaleCode): string {
  const rtf = new Intl.RelativeTimeFormat(tag(locale), { numeric: "auto" });
  const s = Math.round(msFromNow / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return rtf.format(s, "second");
  const m = Math.round(s / 60);
  if (Math.abs(m) < 60) return rtf.format(m, "minute");
  const h = Math.round(m / 60);
  if (Math.abs(h) < 24) return rtf.format(h, "hour");
  const d = Math.round(h / 24);
  return rtf.format(d, "day");
}
