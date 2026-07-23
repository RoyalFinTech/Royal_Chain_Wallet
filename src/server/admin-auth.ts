/**
 * Admin-only middleware for server functions.
 *
 * Two checks, not one: (1) the caller has a valid Supabase session (same
 * JWT verification as requireAuth), AND (2) that auth_user_id has an
 * active row in admin_users. Only after both pass does this hand back a
 * service-role client — regular users must never reach admin data even
 * transiently. SUPABASE_SERVICE_ROLE_KEY is a server-only env var (never
 * VITE_-prefixed) and is never sent to the browser.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";

export const requireAdminAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing Supabase environment variables for admin access (SUPABASE_SERVICE_ROLE_KEY required).",
    );
  }

  const request = getRequest();
  const authHeader = request?.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized.");
  const token = authHeader.replace("Bearer ", "");

  // Step 1: verify the session is real (anon-keyed client, same as requireAuth).
  const sessionClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data: claims, error: claimsError } = await sessionClient.auth.getClaims(token);
  if (claimsError || !claims?.claims?.sub) throw new Error("Unauthorized.");

  // Step 2: service-role client to check admin_users AND to serve the request.
  const adminDb = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data: adminRow, error: adminError } = await adminDb
    .from("admin_users")
    .select("id, role_id, is_active")
    .eq("auth_user_id", claims.claims.sub)
    .maybeSingle();
  if (adminError) throw new Error(adminError.message);
  if (!adminRow || !adminRow.is_active) throw new Error("Forbidden: not an active admin.");

  return next({ context: { db: adminDb, adminId: adminRow.id, roleId: adminRow.role_id } });
});
