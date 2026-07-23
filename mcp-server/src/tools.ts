/**
 * Tool implementations.
 *
 * SECURITY BOUNDARY — read this before changing create_wallet /
 * import_wallet / send_transaction:
 *
 * Royal Chain Wallet is non-custodial: the whole point, established
 * throughout this codebase (src/lib/wallet/*), is that a mnemonic/
 * private key is generated and encrypted ON THE USER'S DEVICE and never
 * transmitted anywhere, including to this server. An MCP tool that
 * accepted or returned a raw mnemonic, or that signed a transaction
 * server-side, would silently turn this into a custodial wallet and
 * defeat that guarantee — a much bigger problem than a missing feature.
 *
 * So these three tools intentionally do NOT perform key generation,
 * import, or signing themselves. Instead they return a deep link /
 * pending-action descriptor that the Royal Chain Wallet app (where the
 * actual crypto happens, on-device) picks up and completes. This keeps
 * the non-custodial guarantee intact while still letting an agent
 * initiate these flows on the user's behalf.
 */
import { z } from "zod";
import { adminClient, userScopedClient } from "./supabase.js";

/* ------------------------------ Schemas ------------------------------ */

export const CreateWalletInput = z.object({
  label: z.string().optional().describe("Display label for the new wallet, e.g. 'Main Wallet'"),
});

export const ImportWalletInput = z.object({
  label: z.string().optional(),
  // Deliberately NOT a mnemonic field — see file header. The MCP tool
  // hands back a link; the phrase is entered in the app, never here.
});

export const GetBalanceInput = z.object({
  accessToken: z.string().describe("The caller's Supabase session access token"),
  walletId: z.string().uuid(),
});

export const GetTransactionsInput = z.object({
  accessToken: z.string(),
  walletId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const SendTransactionInput = z.object({
  accessToken: z.string(),
  walletId: z.string().uuid(),
  toAddress: z.string(),
  assetSymbol: z.string(),
  amount: z.number().positive(),
});

export const SearchUserInput = z.object({
  query: z.string().min(2).describe("Email, phone, or partial name to search for"),
  limit: z.number().int().min(1).max(50).default(10),
});

export const AdminDashboardInput = z.object({});

export const DatabaseStatusInput = z.object({});

/* ---------------------------- Implementations ------------------------- */

export async function createWallet(input: z.infer<typeof CreateWalletInput>) {
  return {
    action: "open_create_wallet_flow",
    deepLink: `royalchainwallet://create-wallet${input.label ? `?label=${encodeURIComponent(input.label)}` : ""}`,
    note:
      "Wallet creation must happen in the Royal Chain Wallet app itself, on the user's device — " +
      "the recovery phrase is generated and encrypted locally and this server never sees it. " +
      "This tool returns a deep link for the app to open the creation flow; it does not create a wallet directly.",
  };
}

export async function importWallet(input: z.infer<typeof ImportWalletInput>) {
  return {
    action: "open_import_wallet_flow",
    deepLink: `royalchainwallet://import-wallet${input.label ? `?label=${encodeURIComponent(input.label)}` : ""}`,
    note:
      "Recovery phrases must be entered directly in the Royal Chain Wallet app — never through a " +
      "chat/agent interface, where they could be logged or exposed. This tool only opens that flow.",
  };
}

export async function getBalance(input: z.infer<typeof GetBalanceInput>) {
  const db = userScopedClient(input.accessToken);
  const { data: account, error: accErr } = await db
    .from("wallet_accounts")
    .select("id, chain, address")
    .eq("wallet_id", input.walletId);
  if (accErr) throw new Error(`getBalance: ${accErr.message}`);

  const { data: balances, error: balErr } = await db
    .from("balances")
    .select("amount, usd_value, wallet_account_id, assets(symbol, name)")
    .in(
      "wallet_account_id",
      (account ?? []).map((a) => a.id),
    );
  if (balErr) throw new Error(`getBalance: ${balErr.message}`);

  return { accounts: account, balances };
}

export async function getTransactions(input: z.infer<typeof GetTransactionsInput>) {
  const db = userScopedClient(input.accessToken);
  const { data, error } = await db
    .from("transactions")
    .select("*")
    .eq("wallet_id", input.walletId)
    .order("created_at", { ascending: false })
    .limit(input.limit);
  if (error) throw new Error(`getTransactions: ${error.message}`);
  return { transactions: data };
}

export async function sendTransaction(input: z.infer<typeof SendTransactionInput>) {
  // Signing happens on-device (see src/lib/wallet/signing.ts). This tool
  // hands back a pending-action descriptor for the app to complete and
  // sign locally — it never constructs or broadcasts a transaction itself.
  return {
    action: "open_send_confirmation",
    deepLink:
      `royalchainwallet://send?walletId=${input.walletId}&to=${encodeURIComponent(input.toAddress)}` +
      `&asset=${input.assetSymbol}&amount=${input.amount}`,
    note:
      "Transaction signing requires the user's on-device PIN and happens entirely inside the " +
      "Royal Chain Wallet app. This tool pre-fills the send flow; it does not move funds itself.",
  };
}

export async function searchUser(input: z.infer<typeof SearchUserInput>) {
  const db = adminClient();
  const { data, error } = await db
    .from("users")
    .select("id, email, display_name, kyc_status, created_at")
    .or(`email.ilike.%${input.query}%,display_name.ilike.%${input.query}%`)
    .limit(input.limit);
  if (error) throw new Error(`searchUser: ${error.message}`);
  return { users: data };
}

export async function adminDashboard() {
  const db = adminClient();
  const [{ count: userCount }, { count: txCount24h }, { count: fraudOpen }] = await Promise.all([
    db.from("users").select("*", { count: "exact", head: true }),
    db
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 86_400_000).toISOString()),
    db.from("fraud_cases").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);
  return {
    totalUsers: userCount ?? 0,
    transactions24h: txCount24h ?? 0,
    openFraudCases: fraudOpen ?? 0,
  };
}

export async function databaseStatus() {
  const db = adminClient();
  const started = Date.now();
  const { error } = await db.from("settings").select("key").limit(1);
  const latencyMs = Date.now() - started;
  return {
    reachable: !error,
    latencyMs,
    error: error?.message ?? null,
    note: error
      ? "If this says 'relation \"settings\" does not exist', the Module 2 migration hasn't been applied to royal_chain_db yet."
      : undefined,
  };
}
