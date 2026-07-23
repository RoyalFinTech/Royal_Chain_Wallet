/**
 * Supabase client typed against our royal_chain_db schema
 * (database.types.ts), reusing the exact same connection the platform
 * already configured (src/integrations/supabase/client.ts) — same URL,
 * same key, same fetch/session handling. This just adds compile-time
 * knowledge of our tables so `supabase.from("wallets")` etc. is fully
 * typed instead of `never`.
 *
 * Once migrations are live and `npx supabase gen types` regenerates
 * src/integrations/supabase/types.ts with real tables, this file becomes
 * redundant — call sites can switch back to the platform-generated
 * client directly. Until then, this is the correct typed entry point for
 * any code querying our custom tables.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createTypedFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

let cached: SupabaseClient<Database> | undefined;

/** Lazily-constructed, schema-typed Supabase client. Same env vars as the platform client. */
export function getTypedSupabase(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables — cannot create typed client.");
  }
  cached = createClient<Database>(url, key, {
    global: { fetch: createTypedFetch(key) },
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return cached;
}
