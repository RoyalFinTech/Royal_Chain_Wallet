/**
 * Portfolio API endpoint (Priority 4).
 * Aggregates balances across every wallet_account for the caller's
 * wallets — the server-side equivalent of walletService.getPortfolio()
 * (src/lib/services/walletService.ts), which today aggregates mock data
 * client-side. Once wallets/balances rows exist for real, this becomes
 * the source of truth; the client-side version remains the demo fallback.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "./auth";

export const getPortfolio = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { data: wallets, error: walletsErr } = await context.db
      .from("wallets")
      .select("id")
      .eq("user_id", context.profileId);
    if (walletsErr) throw new Error(walletsErr.message);
    if (!wallets || wallets.length === 0) return { totalUsd: 0, assets: [] };

    const { data: accounts, error: accountsErr } = await context.db
      .from("wallet_accounts")
      .select("id, chain")
      .in(
        "wallet_id",
        wallets.map((w) => w.id),
      );
    if (accountsErr) throw new Error(accountsErr.message);
    const accountIds = (accounts ?? []).map((a) => a.id);
    if (accountIds.length === 0) return { totalUsd: 0, assets: [] };

    const { data: balances, error: balancesErr } = await context.db
      .from("balances")
      .select("amount, usd_value, wallet_account_id, assets(symbol, name, icon_gradient)")
      .in("wallet_account_id", accountIds);
    if (balancesErr) throw new Error(balancesErr.message);

    const totalUsd = (balances ?? []).reduce((sum, b) => sum + Number(b.usd_value ?? 0), 0);
    return { totalUsd: Number(totalUsd.toFixed(2)), assets: balances ?? [] };
  });
