/**
 * Transaction API endpoints (Priority 4).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth";
import { checkServerRateLimit } from "@/lib/security/lockout";
import { logSecurityEvent } from "@/lib/security/audit";

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator(
    z.object({ walletId: z.string().uuid(), limit: z.number().int().min(1).max(100).default(20) }),
  )
  .handler(async ({ data: input, context }) => {
    // Don't rely only on RLS for this endpoint: verify the requested wallet
    // is owned by the authenticated account before reading its transactions.
    const { data: wallet, error: walletError } = await context.db
      .from("wallets")
      .select("id")
      .eq("id", input.walletId)
      .eq("user_id", context.profileId)
      .maybeSingle();

    if (walletError) {
      console.error("[transactions] Wallet ownership lookup failed:", walletError.message);
      throw new Error("Unable to verify wallet ownership.");
    }
    if (!wallet) throw new Error("Wallet not found or not owned by this user.");

    const { data, error } = await context.db
      .from("transactions")
      .select("*")
      .eq("wallet_id", input.walletId)
      .order("created_at", { ascending: false })
      .limit(input.limit);
    if (error) throw new Error("Unable to load transactions.");
    return data;
  });

export const recordTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    z.object({
      walletId: z.string().uuid(),
      assetId: z.string().uuid(),
      chain: z.enum(["bitcoin", "ethereum", "bnb", "solana"]),
      direction: z.enum(["in", "out"]),
      kind: z
        .enum(["transfer", "deposit", "withdrawal", "merchant_payment", "refund", "reversal"])
        .default("transfer"),
      amount: z.number().positive(),
      usdValue: z.number().nonnegative().optional(),
      toAddress: z.string().max(256).optional(),
      txHash: z.string().max(256).optional(),
      /**
       * This server endpoint supports a simple single-asset posting only.
       * Database validation independently limits this to one user account
       * and one external counterparty account; callers cannot choose arbitrary
       * ledger accounts for a multi-account posting.
       */
      ledgerEntries: z
        .array(
          z.object({
            ledgerAccountId: z.string().uuid(),
            direction: z.enum(["debit", "credit"]),
            amount: z.number().positive(),
          }),
        )
        .length(2),
    }),
  )
  .handler(async ({ data: input, context }) => {
    const { data: wallet, error: walletError } = await context.db
      .from("wallets")
      .select("id")
      .eq("id", input.walletId)
      .eq("user_id", context.profileId)
      .maybeSingle();

    if (walletError) {
      console.error("[transactions] Wallet ownership lookup failed:", walletError.message);
      throw new Error("Unable to verify wallet ownership.");
    }
    if (!wallet) throw new Error("Wallet not found or not owned by this user.");

    const { data: asset, error: assetError } = await context.db
      .from("assets")
      .select("id, chain, is_active")
      .eq("id", input.assetId)
      .maybeSingle();

    if (assetError) {
      console.error("[transactions] Asset lookup failed:", assetError.message);
      throw new Error("Unable to verify the requested asset.");
    }
    if (!asset || !asset.is_active || asset.chain !== input.chain) {
      throw new Error("Asset is unavailable for the requested chain.");
    }

    // The request-authenticated client is required for auth.uid()-bound
    // rate limiting. The limiter fails closed if the database control fails.
    const withinLimit = await checkServerRateLimit(
      context.db,
      `tx:record:${context.userId}`,
      20,
      60,
    );
    if (!withinLimit) throw new Error("Too many transaction writes — please slow down.");

    const { data, error } = await context.db.rpc("record_transaction_with_ledger", {
      p_wallet_id: input.walletId,
      p_asset_id: input.assetId,
      p_chain: input.chain,
      p_direction: input.direction,
      p_kind: input.kind,
      p_amount: input.amount,
      p_status: "pending",
      p_entries: input.ledgerEntries.map((e) => ({
        ledger_account_id: e.ledgerAccountId,
        direction: e.direction,
        amount: e.amount,
      })),
      p_usd_value: input.usdValue ?? null,
      p_counterparty_address: input.toAddress ?? null,
      p_tx_hash: input.txHash ?? null,
    });
    if (error) {
      console.error("[transactions] Atomic transaction recording failed:", error.message);
      throw new Error("Transaction recording failed validation or could not be completed.");
    }

    logSecurityEvent("transaction.recorded", data.id, {
      chain: input.chain,
      direction: input.direction,
      kind: input.kind,
    });
    return data;
  });
