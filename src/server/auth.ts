/**
 * Server function auth middleware, typed against our schema.
 *
 * Mirrors src/integrations/supabase/auth-middleware.ts (same JWT
 * verification via supabase.auth.getClaims — never hand-rolled JWT
 * decoding) but returns a client typed against database.types.ts so
 * server functions querying our custom tables (wallets, transactions,
 * etc.) get full type safety. The platform-generated middleware is left
 * untouched since it's regenerated automatically and used elsewhere.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing Supabase environment variables.");
  }

  const request = getRequest();
  const authHeader = request?.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: missing or malformed Authorization header.");
  }
  const token = authHeader.replace("Bearer ", "");
  if (token.split(".").length !== 3) {
    throw new Error("Unauthorized: invalid token.");
  }

  const db = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await db.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new Error("Unauthorized: invalid session.");
  }

  return next({ context: { db, userId: data.claims.sub as string } });
});
