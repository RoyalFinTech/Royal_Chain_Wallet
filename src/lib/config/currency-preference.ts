/**
 * Dynamic currency preference system.
 *
 * USD is only the *default* for new users — every user can change their
 * display currency at any time, and the choice persists locally. Exchange
 * rates come from CURRENCIES (src/lib/currencies.ts) as static mock data
 * today; PricingService below is the seam a later integration phase plugs
 * a live rates feed into without touching any UI code.
 */
import { useSyncExternalStore } from "react";
import { getEnv, isConfigured } from "./env";
import { CURRENCIES, type CurrencyCode } from "@/lib/currencies";

const STORAGE_KEY = "rcw.currency.preference";
const DEFAULT_CURRENCY: CurrencyCode = "USD";

/**
 * Pluggable exchange-rate source. The mock implementation reads the static
 * table in lib/currencies.ts; a live implementation (added once
 * VITE_PRICE_PROVIDER_URL / VITE_PRICE_PROVIDER_API_KEY are supplied)
 * fetches real rates on the same interface — no caller changes needed.
 */
export interface PricingService {
  getRate(currency: CurrencyCode): Promise<number>; // rate to 1 USD
  getAllRates(): Promise<Record<CurrencyCode, number>>;
}

class MockPricingService implements PricingService {
  async getRate(currency: CurrencyCode): Promise<number> {
    return CURRENCIES[currency].usdRate;
  }
  async getAllRates(): Promise<Record<CurrencyCode, number>> {
    return Object.fromEntries(Object.values(CURRENCIES).map((c) => [c.code, c.usdRate])) as Record<
      CurrencyCode,
      number
    >;
  }
}

/**
 * Live implementation stub. Not used until VITE_PRICE_PROVIDER_URL is set;
 * isConfigured() gates callers away from this until then.
 */
class LivePricingService implements PricingService {
  async getRate(currency: CurrencyCode): Promise<number> {
    const { VITE_PRICE_PROVIDER_URL } = getEnv();
    throw new Error(
      `Live pricing not yet connected (VITE_PRICE_PROVIDER_URL=${VITE_PRICE_PROVIDER_URL ?? "unset"}). ` +
        `Falling back to mock rates is the caller's responsibility via getPricingService().`,
    );
    void currency;
  }
  async getAllRates(): Promise<Record<CurrencyCode, number>> {
    return this.getRate(DEFAULT_CURRENCY).then(() => ({}) as Record<CurrencyCode, number>);
  }
}

export function getPricingService(): PricingService {
  return isConfigured("VITE_PRICE_PROVIDER_URL")
    ? new LivePricingService()
    : new MockPricingService();
}

/* ------------------------- User preference ------------------------- */

function subscribe(cb: () => void) {
  window.addEventListener("rcw:currency-changed", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("rcw:currency-changed", cb);
    window.removeEventListener("storage", cb);
  };
}

function readPreference(): CurrencyCode {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && stored in CURRENCIES ? (stored as CurrencyCode) : DEFAULT_CURRENCY;
}

function getServerSnapshot(): CurrencyCode {
  return DEFAULT_CURRENCY;
}

export function setPreferredCurrency(code: CurrencyCode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, code);
  window.dispatchEvent(new CustomEvent("rcw:currency-changed"));
}

/** Reactive hook: re-renders when the user changes their display currency anywhere in the app. */
export function usePreferredCurrency(): [CurrencyCode, (code: CurrencyCode) => void] {
  const code = useSyncExternalStore(subscribe, readPreference, getServerSnapshot);
  return [code, setPreferredCurrency];
}
