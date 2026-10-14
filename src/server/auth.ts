/**
 * Server function auth middleware, typed against our schema.
 *
 * Verifies the Supabase JWT and resolves the related public.users row.
 * authUserId is the Supabase Auth subject; profileId is the application
 * primary key referenced by wallets, sessions, devices and notifications.
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

  const authUserId = data.claims.sub as string;
  const { data: profile, error: profileError } = await db
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (profileError) {
    console.error("[auth] User profile lookup failed:", profileError.message);
    throw new Error("Unable to resolve the authenticated account profile.");
  }
  if (!profile) {
    throw new Error("Account profile is not set up. Complete account setup before continuing.");
  }

  return next({ context: { db, userId: authUserId, profileId: profile.id } });
});
