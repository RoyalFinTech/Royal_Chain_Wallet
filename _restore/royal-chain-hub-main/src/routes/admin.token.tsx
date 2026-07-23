import { createFileRoute } from "@tanstack/react-router";
import { Coins, Flame, Lock, Send } from "lucide-react";
import { AdminPageHeader, AdminCard, StatTile, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";

export const Route = createFileRoute("/admin/token")({
  component: AdminToken,
});

const stats = [
  { label: "Circulating Supply", value: "42.0M ROY", icon: Coins },
  { label: "Total Supply", value: "100.0M ROY", icon: Lock },
  { label: "Holders", value: "18,204", icon: Coins },
  { label: "24h Volume", value: "$284,910", trend: "+6.1%", icon: Send },
];

const allocations = [
  { label: "Circulating", pct: 42, color: "bg-gold" },
  { label: "Staking Rewards Pool", pct: 20, color: "bg-emerald-500" },
  { label: "Treasury", pct: 18, color: "bg-indigo-500" },
  { label: "Team & Advisors (vesting)", pct: 12, color: "bg-fuchsia-500" },
  { label: "Ecosystem Grants", pct: 8, color: "bg-blue-500" },
];

function AdminToken() {
  const { role } = useAdminRole();
  if (!canAccess(role, "token")) return <NoAccess section="ROY Token Management" />;

  return (
    <div>
      <AdminPageHeader title="ROY Token Management" subtitle="Royal Token — SPL token on Solana" />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="font-display text-base font-bold">Token Allocation</h2>
          <div className="mt-4 space-y-3">
            {allocations.map((a) => (
              <div key={a.label}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{a.label}</span>
                  <span className="text-muted-foreground">{a.pct}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${a.color}`}
                    style={{ width: `${a.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-base font-bold">Mint Controls</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Requires multisig approval from Super Admin + Finance. Not wired to a live program yet.
          </p>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Amount (ROY)</span>
              <input
                placeholder="0.00"
                className="mt-1 h-11 w-full rounded-xl border border-border bg-input/40 px-3 text-sm"
              />
            </label>
            <div className="flex gap-2">
              <button className="grid h-11 flex-1 place-items-center gap-1.5 rounded-xl border border-border bg-card text-xs font-semibold">
                <Flame className="mr-1 inline h-3.5 w-3.5" /> Burn
              </button>
              <button className="grid h-11 flex-1 place-items-center gap-1.5 rounded-xl gradient-gold text-xs font-semibold text-navy shadow-glow">
                <Coins className="mr-1 inline h-3.5 w-3.5" /> Mint
              </button>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
