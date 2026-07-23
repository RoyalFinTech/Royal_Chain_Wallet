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
    const { data, error } = await context.db
      .from("transactions")
      .select("*")
      .eq("wallet_id", input.walletId)
      .order("created_at", { ascending: false })
      .limit(input.limit);
    if (error) throw new Error(error.message);
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
      usdValue: z.number().optional(),
      toAddress: z.string().optional(),
      txHash: z.string().optional(),
      /**
       * The wallet-side and counterparty-side ledger account ids (see
       * ledger_accounts, migration 00000000000003). Callers resolve
       * these up front — e.g. the user's own ledger account for this
       * asset, and a system 'external_unmatched' account for the other
       * side of a transfer to/from an address outside Royal Chain
       * Wallet.
       */
      ledgerEntries: z
        .array(
          z.object({
            ledgerAccountId: z.string().uuid(),
            direction: z.enum(["debit", "credit"]),
            amount: z.number().positive(),
          }),
        )
        .min(2),
    }),
  )
  .handler(async ({ data: input, context }) => {
    // Rate limit: a given user can record at most 20 transactions/minute
    // through this endpoint — real broadcasts are inherently throttled by
    // chain block times, so this mainly guards against a buggy/malicious
    // client hammering the write path.
    const withinLimit = await checkServerRateLimit(`tx:record:${context.userId}`, 20, 60);
    if (!withinLimit) throw new Error("Too many transaction writes — please slow down.");

    // Single atomic call: inserts the transaction row AND posts balanced
    // ledger entries in one Postgres transaction (see migration
    // 00000000000004) — either both happen, or neither does. Verified
    // locally: an unbalanced ledgerEntries set rolls back the whole
    // insert, not just the ledger side (see docs/PRODUCTION_READINESS.md).
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
    if (error) throw new Error(error.message);

    logSecurityEvent("transaction.recorded", data.id, {
      chain: input.chain,
      direction: input.direction,
      kind: input.kind,
    });
    return data;
  });
