import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpRight, RefreshCw, Wallet, AlertTriangle } from "lucide-react";
import { useStoredWallet, usePortfolio } from "@/hooks/use-wallet";
import { ASSET_CATALOG } from "@/lib/services";
import { isChainLive } from "@/lib/config/chains";
import { tokenContractAddress } from "@/lib/config/tokens";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/app/currencies")({
  component: Currencies,
});

const NATIVE_ASSETS = [
  { symbol: "BTC", chain: "bitcoin", name: "Bitcoin" },
  { symbol: "ETH", chain: "ethereum", name: "Ethereum" },
  { symbol: "BNB", chain: "bnb", name: "BNB Chain" },
  { symbol: "SOL", chain: "solana", name: "Solana" },
] as const;

const TOKENS = [
  { symbol: "ROY", name: "Royal Token" },
  { symbol: "USDT", name: "Tether USD" },
  { symbol: "USDC", name: "USD Coin" },
] as const;

function Currencies() {
  const wallet = useStoredWallet();
  const portfolio = usePortfolio(wallet);
  const connectedCount = NATIVE_ASSETS.filter(({ chain }) => isChainLive(chain)).length;

  if (!wallet) {
    return (
      <div className="px-5 pb-10 pt-10">
        <Logo size={42} withText />
        <h1 className="mt-5 font-display text-2xl font-bold">Multi-chain crypto</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create or import a wallet to view its Bitcoin, Ethereum, BNB Chain and Solana addresses.
        </p>
        <Link
          to="/create-wallet"
          className="mt-5 grid h-12 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy"
        >
          Create wallet
        </Link>
        <Link
          to="/import-wallet"
          className="mt-2 grid h-12 place-items-center rounded-xl border border-border bg-card text-sm font-semibold"
        >
          Import wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pb-10 pt-10">
      <header className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Logo size={38} withText />
          <h1 className="mt-4 font-display text-2xl font-bold">Crypto Assets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One self-custody wallet, four native networks
          </p>
        </div>
        <button
          type="button"
          onClick={() => void portfolio.refetch()}
          aria-label="Refresh on-chain balances"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card"
        >
          <RefreshCw className={`h-4 w-4 ${portfolio.isFetching ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div className="mt-5 rounded-3xl gradient-royal p-5 text-white shadow-elegant">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
          Estimated portfolio value
        </p>
        {connectedCount === 0 ? (
          <p className="mt-2 font-display text-xl font-bold">Network data not connected</p>
        ) : portfolio.isError ? (
          <p className="mt-2 font-display text-xl font-bold">Unable to load balances</p>
        ) : portfolio.isLoading ? (
          <p className="mt-2 font-display text-xl font-bold">Loading on-chain balances…</p>
        ) : (
          <p className="mt-2 font-display text-3xl font-bold text-gold-shimmer">
            $
            {portfolio.data?.totalUsd.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        )}
        <p className="mt-2 text-xs leading-5 text-white/65">
          {connectedCount}/4 native network RPCs configured. USD values use sample prices until a
          trusted live market feed is connected.
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            to="/app/receive"
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl gradient-gold text-xs font-semibold text-navy"
          >
            <ArrowDownToLine className="h-4 w-4" /> Receive
          </Link>
          <Link
            to="/send"
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 text-xs font-semibold text-white"
          >
            <ArrowUpRight className="h-4 w-4" /> Send
          </Link>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg font-bold">Native cryptocurrencies</h2>
        <div className="space-y-2">
          {NATIVE_ASSETS.map(({ symbol, chain, name }) => {
            const meta = ASSET_CATALOG[symbol];
            const live = isChainLive(chain);
            const balance = portfolio.data?.assets.find((asset) => asset.symbol === symbol);
            return (
              <div key={symbol} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${meta.iconGradient} text-xs font-bold text-white`}
                  >
                    {symbol.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {symbol} · {chain}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold">
                      {!live
                        ? "RPC offline"
                        : portfolio.isLoading
                          ? "Loading…"
                          : portfolio.isError
                            ? "Unavailable"
                            : `${balance?.amount ?? 0} ${symbol}`}
                    </p>
                    {live && !portfolio.isLoading && !portfolio.isError && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        ~$
                        {(balance?.usdValue ?? 0).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg font-bold">SPL token assets</h2>
        <div className="space-y-2">
          {TOKENS.map(({ symbol, name }) => {
            const mint = tokenContractAddress(symbol);
            return (
              <div
                key={symbol}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${ASSET_CATALOG[symbol].iconGradient} text-xs font-bold text-white`}
                >
                  {symbol.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-[11px] text-muted-foreground">{symbol} · Solana SPL</p>
                </div>
                <p className="max-w-32 text-right text-[10px] leading-4 text-muted-foreground">
                  {mint ? "Mint set; live reader not connected" : "Mint not configured"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-5 text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>
          Royal Chain Wallet does not hold fiat deposits or multi-currency cash balances. Token
          mint/contract reads and signed SPL transfers are not enabled yet. No unverified asset
          balance is shown as real.
        </p>
      </div>
    </div>
  );
}
