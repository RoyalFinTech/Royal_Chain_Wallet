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
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data;
  });

export const getWalletAccounts = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator(z.object({ walletId: z.string().uuid() }))
  .handler(async ({ data: input, context }) => {
    // Ownership check happens implicitly via RLS once policies are added
    // (Module 2 migration note); this explicit check is defense-in-depth
    // for the window before those policies exist.
    const { data: wallet, error: ownErr } = await context.db
      .from("wallets")
      .select("id")
      .eq("id", input.walletId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (ownErr) throw new Error(ownErr.message);
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
      label: z.string().default("Main Wallet"),
      accounts: z.array(
        z.object({
          chain: z.enum(["bitcoin", "ethereum", "bnb", "solana"]),
          address: z.string(),
          derivationPath: z.string(),
        }),
      ),
    }),
  )
  .handler(async ({ data: input, context }) => {
    // Note: the mnemonic itself is NEVER sent here — only the public
    // addresses derived on-device, matching the non-custodial model
    // documented throughout src/lib/wallet/.
    const { data: wallet, error: walletErr } = await context.db
      .from("wallets")
      .insert({ user_id: context.userId, label: input.label, is_primary: true })
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
    if (accountsErr) throw new Error(accountsErr.message);

    return wallet;
  });
