import { createFileRoute } from "@tanstack/react-router";
import { Users, Wallet, ArrowUpRight, ShieldAlert } from "lucide-react";
import { formatMoney, MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { TransactionCard } from "@/components/wallet/TransactionCard";
import { AdminPageHeader, AdminCard, StatTile } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const stats = [
  { label: "Total Users", value: "24,891", trend: "+8.2%", icon: Users },
  { label: "Wallet Volume (24h)", value: "$1.92M", trend: "+12.4%", icon: Wallet },
  { label: "Transactions (24h)", value: "1,204", trend: "+3.1%", icon: ArrowUpRight },
  { label: "Flagged", value: "12", trend: "-4", icon: ShieldAlert },
];

const chainVolume = [
  { chain: "Bitcoin", pct: 34, color: "bg-orange-500" },
  { chain: "Ethereum", pct: 27, color: "bg-indigo-500" },
  { chain: "Solana", pct: 22, color: "bg-fuchsia-500" },
  { chain: "BNB Chain", pct: 11, color: "bg-yellow-500" },
  { chain: "ROY / stables", pct: 6, color: "bg-emerald-500" },
];

function AdminDashboard() {
  return (
    <div>
      <AdminPageHeader
        title="Overview"
        subtitle="System-wide performance & activity across every chain."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Recent Transactions</h2>
            <button className="text-xs text-gold hover:underline">Export CSV</button>
          </div>
          <div className="mt-4 space-y-2">
            {MOCK_TRANSACTIONS.slice(0, 6).map((tx) => (
              <TransactionCard key={tx.id} tx={tx} />
            ))}
          </div>
        </AdminCard>

        <div className="rounded-3xl gradient-royal p-5 text-white shadow-elegant">
          <p className="text-xs uppercase tracking-widest text-white/60">Reserve Balance</p>
          <p className="mt-1 font-display text-3xl font-bold text-gold-shimmer">
            {formatMoney(842150)}
          </p>
          <p className="mt-1 text-xs text-white/60">Held across all pools</p>

          <div className="mt-5 space-y-2 text-sm">
            {[
              { k: "Active users (24h)", v: "3,281" },
              { k: "Avg. tx value", v: "$62.40" },
              { k: "System uptime", v: "99.99%" },
            ].map((r) => (
              <div key={r.k} className="flex justify-between text-white/80">
                <span>{r.k}</span>
                <span className="font-semibold text-white">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AdminCard className="mt-6">
        <h2 className="font-display text-base font-bold">Volume by Chain</h2>
        <div className="mt-4 space-y-3">
          {chainVolume.map((c) => (
            <div key={c.chain}>
              <div className="flex justify-between text-xs">
                <span className="font-medium">{c.chain}</span>
                <span className="text-muted-foreground">{c.pct}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
