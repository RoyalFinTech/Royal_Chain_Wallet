/**
 * Supabase access for the MCP server.
 *
 * Deliberately uses supabase-js (PostgREST over HTTPS) rather than a
 * direct `pg` connection — this is the "never expose PostgreSQL
 * directly" requirement. Every query still goes through RLS (or, for
 * admin operations, a service-role key that's never sent to the MCP
 * client, only held in this process's environment).
 *
 * Two clients:
 *  - `userScopedClient(accessToken)` — RLS-scoped to whichever user's
 *    session token is passed in by the tool caller. Used for wallet/
 *    balance/transaction tools, which must only see that user's data.
 *  - `adminClient()` — service-role, bypasses RLS. Used only for
 *    search_user/admin_dashboard/database_status, which are
 *    admin-only tools; callers of THIS MCP server are expected to have
 *    already authenticated as an admin at the transport layer (out of
 *    scope for this file — see mcp-server/README.md).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. The MCP server needs its own service credentials — ` +
        `see mcp-server/.env.example. It does not reuse the browser app's anon key.`,
    );
  }
  return value;
}

let admin: SupabaseClient | undefined;

/** Service-role client — full read access for admin tools, bypasses RLS. Never expose this key to MCP clients. */
export function adminClient(): SupabaseClient {
  if (admin) return admin;
  const url = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** RLS-scoped client for a specific user's session — used by wallet/balance/tx tools. */
export function userScopedClient(accessToken: string): SupabaseClient {
  const url = requireEnv("SUPABASE_URL");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
