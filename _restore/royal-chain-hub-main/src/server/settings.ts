/**
 * Settings API endpoints (Priority 4).
 * Persists the preferences already collected client-side in
 * src/lib/config/currency-preference.ts and src/lib/i18n/provider.tsx
 * (currently localStorage-only) to the user's profile row, so
 * preferences survive a reinstall/new device once wired up client-side.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth";

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db
      .from("users")
      .select("preferred_currency, preferred_locale, kyc_status")
      .eq("auth_user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (
      data ?? { preferred_currency: "USD", preferred_locale: "en", kyc_status: "none" as const }
    );
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    z.object({
      preferredCurrency: z.string().length(3).optional(),
      preferredLocale: z.string().max(8).optional(),
    }),
  )
  .handler(async ({ data: input, context }) => {
    const patch: { preferred_currency?: string; preferred_locale?: string } = {};
    if (input.preferredCurrency) patch.preferred_currency = input.preferredCurrency;
    if (input.preferredLocale) patch.preferred_locale = input.preferredLocale;
    if (Object.keys(patch).length === 0) return { updated: false };

    const { error } = await context.db
      .from("users")
      .update(patch)
      .eq("auth_user_id", context.userId);
    if (error) throw new Error(error.message);
    return { updated: true };
  });
