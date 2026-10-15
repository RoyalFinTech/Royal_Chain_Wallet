/**
 * Security API endpoints (Priority 4).
 * Server-side counterpart to the on-device security state already built
 * in src/lib/security/ and surfaced in src/routes/app.security.tsx.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth";

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db
      .from("sessions")
      .select("*")
      .eq("user_id", context.profileId)
      .is("revoked_at", null)
      .order("last_activity_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const revokeSession = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(z.object({ sessionId: z.string().uuid() }))
  .handler(async ({ data: input, context }) => {
    const { error } = await context.db
      .from("sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", input.sessionId)
      .eq("user_id", context.profileId);
    if (error) throw new Error(error.message);
    return { revoked: true };
  });

export const listDevices = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db
      .from("devices")
      .select("*")
      .eq("user_id", context.profileId);
    if (error) throw new Error(error.message);
    return data;
  });

export const removeDevice = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(z.object({ deviceId: z.string().uuid() }))
  .handler(async ({ data: input, context }) => {
    const { error } = await context.db
      .from("devices")
      .delete()
      .eq("id", input.deviceId)
      .eq("user_id", context.profileId);
    if (error) throw new Error(error.message);
    return { removed: true };
  });
