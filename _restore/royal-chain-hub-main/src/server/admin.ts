/**
 * Admin API endpoints (Priority 4).
 * Backs the admin portal (src/routes/admin.*.tsx), which today renders
 * against inline mock arrays. These endpoints are the real data source
 * to wire those routes to next — not done in this phase per the
 * "do not redesign the UI" instruction, but the endpoints exist and work.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "./admin-auth";
import { logSecurityEvent } from "@/lib/security/audit";

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator(
    z.object({
      query: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    }),
  )
  .handler(async ({ data: input, context }) => {
    let q = context.db.from("users").select("*", { count: "exact" });
    if (input.query) q = q.or(`email.ilike.%${input.query}%,display_name.ilike.%${input.query}%`);
    const from = (input.page - 1) * input.pageSize;
    const { data, error, count } = await q.range(from, from + input.pageSize - 1);
    if (error) throw new Error(error.message);
    return { users: data, total: count ?? 0, page: input.page, pageSize: input.pageSize };
  });

export const adminDashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async ({ context }) => {
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const [{ count: totalUsers }, { count: transactions24h }, { count: flaggedCount }] =
      await Promise.all([
        context.db.from("users").select("*", { count: "exact", head: true }),
        context.db
          .from("transactions")
          .select("*", { count: "exact", head: true })
          .gte("created_at", dayAgo),
        context.db
          .from("fraud_cases")
          .select("*", { count: "exact", head: true })
          .eq("status", "open"),
      ]);
    return {
      totalUsers: totalUsers ?? 0,
      transactions24h: transactions24h ?? 0,
      flaggedCount: flaggedCount ?? 0,
    };
  });

export const adminGetAuditLog = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
  .handler(async ({ data: input, context }) => {
    const { data, error } = await context.db
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(input.limit);
    if (error) throw new Error(error.message);
    return data;
  });

export const adminFlagUser = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator(
    z.object({
      userId: z.string().uuid(),
      reason: z.string().min(3),
      amountUsd: z.number().optional(),
    }),
  )
  .handler(async ({ data: input, context }) => {
    const { data, error } = await context.db
      .from("fraud_cases")
      .insert({
        user_id: input.userId,
        reason: input.reason,
        amount_usd: input.amountUsd != null ? String(input.amountUsd) : null,
        severity: "medium",
        status: "open",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await context.db.from("audit_logs").insert({
      actor_admin_id: context.adminId,
      action: "users.flag",
      target: `users.${input.userId}`,
      metadata: { reason: input.reason },
    });
    logSecurityEvent("admin.user_flagged", input.userId, { reason: input.reason });
    return data;
  });
