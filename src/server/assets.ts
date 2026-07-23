/**
 * Assets API endpoint (Priority 4).
 * Server-side counterpart to the client-side ASSET_CATALOG
 * (src/lib/services/mockData.ts) and TOKEN_REGISTRY
 * (src/lib/config/tokens.ts) — the durable, admin-editable version of
 * "which assets does the wallet support."
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "./auth";

export const listAssets = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db.from("assets").select("*").eq("is_active", true);
    if (error) throw new Error(error.message);
    return data;
  });
