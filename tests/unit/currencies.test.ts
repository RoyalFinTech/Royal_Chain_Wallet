import { describe, it, expect } from "vitest";
import { convert, formatCurrency, CURRENCIES } from "@/lib/currencies";

describe("lib/currencies", () => {
  it("converts round-trip back to (approximately) the original amount", () => {
    const usd = 100;
    const gbp = convert(usd, "USD", "GBP");
    const back = convert(gbp, "GBP", "USD");
    expect(back).toBeCloseTo(usd, 5);
  });

  it("formats currency with the correct symbol", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
  });

  it("has every currency's rate expressed relative to USD = 1", () => {
    expect(CURRENCIES.USD.usdRate).toBe(1);
  });
});
