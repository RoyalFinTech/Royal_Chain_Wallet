import { createFileRoute, Link } from "@tanstack/react-router";

import {
  Bell,
  ScanLine,
  Send,
  Plus,
  ArrowDownToLine,
  Receipt,
  Repeat,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  QrCode,
  Wallet,
  LayoutGrid,
  ArrowLeftRight,
  Lock,
} from "lucide-react";
import { WalletStrip } from "@/components/wallet/WalletStrip";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Logo } from "@/components/brand/Logo";
import { formatMoney } from "@/lib/mock-data";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useStoredWallet, useTransactionHistory, usePortfolio } from "@/hooks/use-wallet";
import { ASSET_CATALOG } from "@/lib/services";
import { isChainLive } from "@/lib/config/chains";
import { tokenContractAddress } from "@/lib/config/tokens";
import {
  TransactionListSkeleton,
  AccountSummarySkeleton,
  InsightCardSkeleton,
} from "@/components/ui/skeletons";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";
import { staggerDelay } from "@/lib/motion";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const BTC_TREND_DATA = [
  { name: "Mon", amount: 61800 },
  { name: "Tue", amount: 62400 },
  { name: "Wed", amount: 61750 },
  { name: "Thu", amount: 63600 },
  { name: "Fri", amount: 62900 },
  { name: "Sat", amount: 64100 },
  { name: "Sun", amount: 64200 },
];

const SOL_TREND_DATA = [
  { name: "Mon", amount: 151 },
  { name: "Tue", amount: 149 },
  { name: "Wed", amount: 153 },
  { name: "Thu", amount: 147 },
  { name: "Fri", amount: 150 },
  { name: "Sat", amount: 146 },
  { name: "Sun", amount: 148 },
];

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
};

const quickActions = [
  { to: "/send", label: "Send Crypto", icon: Send, color: "from-amber-400 to-yellow-600" },
  {
    to: "/app/receive",
    label: "Receive",
    icon: ArrowDownToLine,
    color: "from-emerald-400 to-teal-600",
  },
  { to: "/qr", label: "QR Tools", icon: QrCode, color: "from-orange-400 to-amber-600" },
  { to: "/app/tokens", label: "Tokens", icon: Wallet, color: "from-cyan-400 to-blue-600" },
  {
    to: "/app/walletconnect",
    label: "WalletConnect",
    icon: ArrowLeftRight,
    color: "from-violet-400 to-purple-600",
  },
  {
    to: "/app/transactions",
    label: "Activity",
    icon: Receipt,
    color: "from-blue-400 to-indigo-600",
  },
  { to: "/app/swap", label: "Swap Preview", icon: Repeat, color: "from-rose-400 to-red-600" },
  { to: "/app/security", label: "Security", icon: Lock, color: "from-lime-400 to-green-600" },
];

function Dashboard() {
  const storedWallet = useStoredWallet();
  const portfolio = usePortfolio(storedWallet);
  const solanaAddress = storedWallet?.addresses.solana.address;
  const walletLabel = solanaAddress
    ? `RCW-${solanaAddress.slice(-8, -4).toUpperCase()}-${solanaAddress.slice(-4).toUpperCase()}`
    : "No wallet created";
  const txHistory = useTransactionHistory(storedWallet);
  const loadingInsights = useSimulatedLoading(800);

  return (
    <div className="mx-auto w-full px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
      {/* Top bar */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0">
            <Logo size={44} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{greet()},</p>
            <p className="truncate font-display text-base font-bold">Your Royal Wallet</p>
            <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
              <span>{walletLabel}</span>
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${storedWallet ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
              >
                <ShieldCheck className="h-2.5 w-2.5" />{" "}
                {storedWallet ? "PIN encrypted" : "Setup needed"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/qr"
            aria-label="Scan"
            className="grid h-10 w-10 place-items-center rounded-full glass"
          >
            <ScanLine className="h-4 w-4" />
          </Link>
          <Link
            to="/app/alerts"
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full glass"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold ring-2 ring-background" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Live multi-chain wallet */}
      <div className="mt-6">
        <WalletStrip />
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-[11px] leading-5 text-muted-foreground">
          Network balances are shown only when the corresponding RPC is configured. USD prices and
          trend charts are sample estimates until a live market-data source is connected. Transfers
          never simulate success.
        </p>
      </div>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Multi-chain assets</h2>
          <Link to="/app/tokens" className="text-xs text-gold hover:underline">
            Token details
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          {(
            [
              { symbol: "BTC", chain: "bitcoin", name: "Bitcoin" },
              { symbol: "ETH", chain: "ethereum", name: "Ethereum" },
              { symbol: "BNB", chain: "bnb", name: "BNB Chain" },
              { symbol: "SOL", chain: "solana", name: "Solana" },
            ] as const
          ).map(({ symbol, chain, name }) => {
            const meta = ASSET_CATALOG[symbol];
            const live = isChainLive(chain);
            const balance = portfolio.data?.assets.find((asset) => asset.symbol === symbol);
            return (
              <div
                key={symbol}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${meta.iconGradient} text-xs font-bold text-white`}
                  >
                    {symbol.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    <p className="text-[10px] text-muted-foreground">{symbol}</p>
                  </div>
                </div>
                <p className="mt-4 font-display text-lg font-bold">
                  {!live
                    ? "RPC not connected"
                    : portfolio.isLoading
                      ? "Loading…"
                      : `${balance?.amount ?? 0} ${symbol}`}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {!live
                    ? "No on-chain balance fetched"
                    : portfolio.isError
                      ? "Balance unavailable"
                      : `USD value is estimated`}
                </p>
              </div>
            );
          })}
          <div className="rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full gradient-gold text-xs font-bold text-navy">
                R
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Royal Token</p>
                <p className="text-[10px] text-muted-foreground">ROY · planned SPL token</p>
              </div>
            </div>
            <p className="mt-4 font-display text-lg font-bold">
              {tokenContractAddress("ROY") ? "Token reader not connected" : "Mint not configured"}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">Not yet verified on-chain</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Quick Actions</h2>
          <Link to="/app/payments" className="text-xs text-gold hover:underline">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {quickActions.map(({ to, label, icon: Icon, color }) => (
            <Link
              key={label}
              to={to}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-soft`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-medium leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Insights */}
      <section className="mt-8">
        <h2 className="mb-1 font-display text-lg font-bold">Crypto market preview</h2>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Illustrative 7-day trajectories · not live market data
        </p>
        {loadingInsights ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InsightCardSkeleton />
              <InsightCardSkeleton />
            </div>
            <div className="mt-3">
              <AccountSummarySkeleton />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InsightCard
                title="Bitcoin (BTC)"
                total={64200}
                trend={2.4}
                data={BTC_TREND_DATA}
                tone="up"
              />
              <InsightCard
                title="Solana (SOL)"
                total={148}
                trend={-1.2}
                data={SOL_TREND_DATA}
                tone="down"
              />
            </div>
            <div className="mt-3 rounded-2xl border border-border bg-card p-3 text-xs leading-5 text-muted-foreground">
              Live spot prices, portfolio valuations, and historical charts need a market-data
              provider. These sample trajectories are visual previews only and should not be used to
              make trading decisions.
            </div>
          </>
        )}
      </section>

      {/* Recent Transactions */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent transactions</h2>
          <Link to="/app/transactions" className="text-xs text-gold hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {txHistory.isLoading ? (
            <TransactionListSkeleton rows={4} />
          ) : (txHistory.data ?? []).length > 0 ? (
            (txHistory.data ?? []).slice(0, 4).map((tx, i) => (
              <div
                key={tx.id}
                className="animate-fade-in flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {tx.direction === "in" ? "Received" : "Sent"} {tx.symbol}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                    {tx.hash}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-sm font-bold">
                    {tx.direction === "in" ? "+" : "−"}
                    {tx.amount} {tx.symbol}
                  </p>
                  <p
                    className={`mt-1 text-[10px] font-semibold ${tx.status === "confirmed" ? "text-success" : tx.status === "failed" ? "text-destructive" : "text-amber-600"}`}
                  >
                    {tx.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-4">
              <p className="text-sm font-semibold">No transaction activity to show</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                This build does not yet index incoming on-chain activity. Transactions are only
                listed here when the app has a real hash from a live chain operation.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InsightCard({
  title,
  total,
  trend,
  data,
  tone,
}: {
  title: string;
  total: number;
  trend: number;
  data: { name: string; amount: number }[];
  tone: "up" | "down";
}) {
  const positive = tone === "up";
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{title} · sample 7d</p>
      <p className="mt-1 font-display text-xl font-bold">{formatMoney(total)}</p>
      <div
        className={`mt-1 inline-flex items-center gap-1 text-xs ${positive ? "text-success" : "text-destructive"}`}
      >
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {trend > 0 ? "+" : ""}
        {trend}%
      </div>
      <div className="mt-3 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" hide />
            <Tooltip
              cursor={{ stroke: "var(--gold)", strokeOpacity: 0.3 }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--gold)"
              strokeWidth={2}
              fill={`url(#grad-${title})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
