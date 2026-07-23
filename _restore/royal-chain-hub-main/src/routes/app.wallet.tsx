import { createFileRoute, Link } from "@tanstack/react-router";
import { WalletCard } from "@/components/wallet/WalletCard";
import { formatMoney } from "@/lib/mock-data";
import {
  ArrowDownToLine,
  Send,
  Plus,
  Copy,
  Vault,
  PiggyBank,
  Coins,
  Image as ImageIcon,
} from "lucide-react";
import {
  WalletBalanceSkeleton,
  AccountSummarySkeleton,
  CardRowSkeleton,
  SkeletonLine,
} from "@/components/ui/skeletons";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";
import { staggerDelay } from "@/lib/motion";

export const Route = createFileRoute("/app/wallet")({
  component: WalletPage,
});

const pockets = [
  { name: "Main Wallet", balance: 12480.5, icon: Coins },
  { name: "Savings Vault", balance: 5000, icon: Vault },
  { name: "Bills Pocket", balance: 1200, icon: PiggyBank },
];

function WalletPage() {
  const loadingBalance = useSimulatedLoading(700);
  const loadingSummary = useSimulatedLoading(900);
  const loadingPockets = useSimulatedLoading(1100);
  const summary = [
    { label: "Total", value: formatMoney(18680.5), sub: "3 pockets" },
    { label: "This month", value: "+D2,140", sub: "inflow" },
    { label: "Reserved", value: "D1,200", sub: "bills" },
  ];

  return (
    <div className="px-5 pt-10">
      <PageHeader title="My Wallet" subtitle="Manage your balances & pockets" />

      <div className="mt-5">{loadingBalance ? <WalletBalanceSkeleton /> : <WalletCard />}</div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3 text-xs">
        <span className="text-muted-foreground">Wallet ID</span>
        {loadingBalance ? (
          <SkeletonLine className="h-3 w-28" />
        ) : (
          <span className="font-mono">RCW-8842-1930</span>
        )}
        <button className="press grid h-7 w-7 place-items-center rounded-full bg-muted">
          <Copy className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { to: "/deposit", label: "Add", icon: Plus },
          { to: "/send", label: "Send", icon: Send },
          { to: "/deposit", label: "Withdraw", icon: ArrowDownToLine },
        ].map(({ to, label, icon: Icon }, i) => (
          <Link
            key={label}
            to={to}
            className="press animate-fade-in flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3 text-xs font-medium hover:shadow-soft"
            style={staggerDelay(i, 50)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full gradient-gold text-navy">
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </Link>
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg font-bold">On-chain assets</h2>
      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/app/tokens"
          className="press flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-soft"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
            <Coins className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Jettons</p>
            <p className="text-[11px] text-muted-foreground">TON tokens</p>
          </div>
        </Link>
        <Link
          to="/app/nfts"
          className="press flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-soft"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
            <ImageIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Collectibles</p>
            <p className="text-[11px] text-muted-foreground">NFT gallery</p>
          </div>
        </Link>
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg font-bold">Account summary</h2>
      {loadingSummary ? (
        <AccountSummarySkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {summary.map((s, i) => (
            <div
              key={s.label}
              className="animate-fade-in rounded-2xl border border-border bg-card p-3 text-center"
              style={staggerDelay(i, 60)}
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 font-display text-sm font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 mb-3 font-display text-lg font-bold">Pockets</h2>
      <div className="space-y-2">
        {loadingPockets
          ? Array.from({ length: 3 }).map((_, i) => <CardRowSkeleton key={i} />)
          : pockets.map(({ name, balance, icon: Icon }, i) => (
              <div
                key={name}
                className="press animate-fade-in flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                style={staggerDelay(i, 60)}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <p className="font-display text-base font-bold">{formatMoney(balance)}</p>
              </div>
            ))}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header>
      <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
