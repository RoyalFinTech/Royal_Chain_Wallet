import { Link } from "@tanstack/react-router";
import { Wallet, RefreshCw, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useStoredWallet, usePortfolio, useTransactionHistory } from "@/hooks/use-wallet";
import { shortenAddress } from "@/lib/wallet";
import { isChainLive } from "@/lib/config/chains";
import { SkeletonLine } from "@/components/ui/skeletons";

/**
 * Live multi-chain wallet strip: shows total portfolio value, primary
 * address, and recent activity across BTC, ETH, BNB, SOL, ROY, USDT, USDC.
 *
 * Falls back to a soft prompt when no wallet has been created yet.
 */
export function WalletStrip() {
  const wallet = useStoredWallet();
  const portfolio = usePortfolio(wallet);
  const history = useTransactionHistory(wallet);
  const [copied, setCopied] = useState(false);

  if (!wallet) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
            <Wallet className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Connect Royal Chain Wallet</p>
            <p className="text-[11px] text-muted-foreground">
              Create or import a wallet to hold BTC, ETH, BNB, SOL, ROY and more.
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            to="/create-wallet"
            className="grid h-10 flex-1 place-items-center rounded-full gradient-gold text-xs font-semibold text-navy shadow-glow"
          >
            Create
          </Link>
          <Link
            to="/import-wallet"
            className="grid h-10 flex-1 place-items-center rounded-full border border-border bg-card text-xs font-semibold"
          >
            Import
          </Link>
        </div>
      </div>
    );
  }

  const primaryAddress = wallet.addresses.solana.address;
  const liveNetworkCount = (["bitcoin", "ethereum", "bnb", "solana"] as const).filter(isChainLive).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(primaryAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full gradient-gold text-navy">
            <Wallet className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold">Royal Chain Wallet</p>
            <p className="text-[10px] text-muted-foreground">Crypto portfolio · USD estimate</p>
          </div>
        </div>
        <button
          onClick={() => {
            void portfolio.refetch();
            void history.refetch();
          }}
          className="grid h-8 w-8 place-items-center rounded-full bg-muted"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${portfolio.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-4">
        {portfolio.isLoading ? (
          <SkeletonLine className="h-8 w-40" />
        ) : portfolio.isError ? (
          <p className="font-display text-sm text-destructive">Unable to load balance</p>
        ) : liveNetworkCount === 0 ? (
          <p className="font-display text-lg font-bold text-foreground">Network data not connected</p>
        ) : (
          <p className="font-display text-3xl font-bold text-gold-shimmer">
            $
            {portfolio.data?.totalUsd.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span
              className={`ml-2 align-middle text-sm font-semibold ${(portfolio.data?.change24hPct ?? 0) >= 0 ? "text-success" : "text-destructive"}`}
            >
              {(portfolio.data?.change24hPct ?? 0) >= 0 ? "+" : ""}
              {portfolio.data?.change24hPct.toFixed(2)}%
            </span>
          </p>
        )}
        <button
          onClick={copy}
          className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {shortenAddress(primaryAddress, 6, 6)}
        </button>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {liveNetworkCount}/4 native networks connected · market prices are estimates until a live price feed is set
        </p>
      </div>

      <div className="mt-4 border-t border-dashed border-border pt-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Recent activity
          </p>
          <Link to="/app/transactions" className="text-[10px] text-gold hover:underline">
            View all
          </Link>
        </div>
        {history.isLoading ? (
          <div className="mt-2 space-y-1.5">
            <SkeletonLine className="h-3 w-full" />
            <SkeletonLine className="h-3 w-4/5" />
          </div>
        ) : history.data && history.data.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {history.data.slice(0, 3).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-foreground/80">
                  {tx.direction === "in" ? "Received" : "Sent"} {tx.symbol}
                </span>
                <span
                  className={`shrink-0 font-mono ${tx.direction === "in" ? "text-success" : "text-muted-foreground"}`}
                >
                  {tx.direction === "in" ? "+" : "-"}
                  {tx.amount}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground">
            No activity yet.{" "}
            <Link to="/app/receive" className="text-gold hover:underline">
              Receive assets <ExternalLink className="ml-0.5 inline h-2.5 w-2.5" />
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
