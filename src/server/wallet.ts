/**
 * Wallet API endpoints (Priority 4).
 * Server functions, not a separate REST server — TanStack Start compiles
 * these into real HTTP endpoints under the hood while giving normal
 * function-call ergonomics on the client (see attachSupabaseAuth in
 * src/start.ts, which auto-attaches the bearer token to every call).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth";

export const listWallets = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.db
      .from("wallets")
      .select("*")
      .eq("user_id", context.profileId);
    if (error) throw new Error(error.message);
    return data;
  });

export const getWalletAccounts = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator(z.object({ walletId: z.string().uuid() }))
  .handler(async ({ data: input, context }) => {
    const { data: wallet, error: ownErr } = await context.db
      .from("wallets")
      .select("id")
      .eq("id", input.walletId)
      .eq("user_id", context.profileId)
      .maybeSingle();
    if (ownErr) throw new Error("Unable to verify wallet ownership.");
    if (!wallet) throw new Error("Wallet not found or not owned by this user.");

    const { data, error } = await context.db
      .from("wallet_accounts")
      .select("*")
      .eq("wallet_id", input.walletId);
    if (error) throw new Error(error.message);
    return data;
  });

export const createWalletRecord = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    z.object({
      label: z.string().trim().min(1).max(80).default("Main Wallet"),
      accounts: z
        .array(
          z.object({
            chain: z.enum(["bitcoin", "ethereum", "bnb", "solana"]),
            address: z.string().trim().min(1).max(256),
            derivationPath: z.string().trim().min(1).max(128),
          }),
        )
        .min(1)
        .max(4),
    }),
  )
  .handler(async ({ data: input, context }) => {
    // The mnemonic/private keys are never sent to the server.
    // A single database function inserts the wallet and all public chain
    // accounts atomically; a failed account insert rolls the wallet back.
    const { data: wallet, error } = await context.db.rpc("create_wallet_with_accounts", {
      p_label: input.label,
      p_accounts: input.accounts.map((account) => ({
        chain: account.chain,
        address: account.address,
        derivationPath: account.derivationPath,
      })),
    });

    if (error) {
      console.error("[wallet] Atomic wallet creation failed:", error.message);
      throw new Error("Unable to create the wallet and its chain accounts.");
    }
    return wallet;
  });
