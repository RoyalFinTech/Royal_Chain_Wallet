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
    const { data: wallet, error: walletErr } = await context.db
      .from("wallets")
      .insert({ user_id: context.profileId, label: input.label, is_primary: true })
      .select("*")
      .single();
    if (walletErr) throw new Error(walletErr.message);

    const { error: accountsErr } = await context.db.from("wallet_accounts").insert(
      input.accounts.map((a) => ({
        wallet_id: wallet.id,
        chain: a.chain,
        address: a.address,
        derivation_path: a.derivationPath,
      })),
    );
    if (accountsErr)
      throw new Error("Wallet was created, but account setup failed. Contact support.");

    return wallet;
  });
