/**
 * Notification API endpoints (Priority 4).
 * Server-side counterpart to the client-composed feed in
 * src/routes/app.alerts.tsx (which today merges live tx history with
 * client-generated price/security items). This is the durable,
 * cross-device notification store once wired up.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth";

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator(
    z.object({
      unreadOnly: z.boolean().default(false),
      limit: z.number().int().min(1).max(100).default(30),
    }),
  )
  .handler(async ({ data: input, context }) => {
    let query = context.db.from("notifications").select("*").eq("user_id", context.userId);
    if (input.unreadOnly) query = query.eq("read", false);
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(input.limit);
    if (error) throw new Error(error.message);
    return data;
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(z.object({ notificationId: z.string().uuid() }))
  .handler(async ({ data: input, context }) => {
    const { error } = await context.db
      .from("notifications")
      .update({ read: true })
      .eq("id", input.notificationId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { updated: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { error } = await context.db
      .from("notifications")
      .update({ read: true })
      .eq("user_id", context.userId)
      .eq("read", false);
    if (error) throw new Error(error.message);
    return { updated: true };
  });
