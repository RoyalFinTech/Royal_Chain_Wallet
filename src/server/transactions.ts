/**
 * Transaction API endpoints.
 *
 * History reads are scoped to an explicitly verified wallet owner.
 * Transaction/ledger writes are intentionally disabled until a trusted
 * server-side chain verifier can prove finality and invoke the privileged
 * ledger procedure. The browser must never assert a transaction is confirmed.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth";

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator(
    z.object({ walletId: z.string().uuid(), limit: z.number().int().min(1).max(100).default(20) }),
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
      amount: z.number().finite().positive(),
      usdValue: z.number().finite().nonnegative().optional(),
      toAddress: z.string().max(256).optional(),
      txHash: z.string().max(256).optional(),
      ledgerEntries: z
        .array(
          z.object({
            ledgerAccountId: z.string().uuid(),
            direction: z.enum(["debit", "credit"]),
            amount: z.number().finite().positive(),
          }),
        )
        .length(2),
    }),
  )
  .handler(async () => {
    throw new Error(
      "Server-side blockchain verification is not configured. No transaction or ledger entry was recorded.",
    );
  });
