import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Users, Repeat, Wallet } from "lucide-react";
import { AdminPageHeader, AdminCard, StatTile, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

const weeklyActive = [2840, 3010, 2975, 3210, 3450, 3690, 3281];
const weeklyVolumeUsd = [412_000, 398_000, 455_000, 471_000, 502_000, 489_000, 521_000];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Sparkbars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="mt-3 flex h-24 items-end gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={`w-full rounded-t-md ${color}`}
            style={{ height: `${(v / max) * 100}%` }}
          />
          <span className="text-[9px] text-muted-foreground">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function AdminAnalytics() {
  const { role } = useAdminRole();
  if (!canAccess(role, "analytics")) return <NoAccess section="Analytics" />;

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        subtitle="Growth and engagement across Royal Chain Wallet"
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="New Wallets (7d)" value="1,842" trend="+14.2%" icon={Wallet} />
        <StatTile label="Weekly Active" value="3,281" trend="+8.7%" icon={Users} />
        <StatTile label="Swap Volume (7d)" value="$318,940" trend="+5.9%" icon={Repeat} />
        <StatTile label="Retention (D7)" value="61.4%" trend="+2.1%" icon={TrendingUp} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="font-display text-base font-bold">Weekly Active Wallets</h2>
          <Sparkbars data={weeklyActive} color="bg-gold" />
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-base font-bold">Volume (USD)</h2>
          <Sparkbars data={weeklyVolumeUsd} color="bg-emerald-500" />
        </AdminCard>
      </div>

      <AdminCard className="mt-4">
        <h2 className="font-display text-base font-bold">Asset Mix (new wallets, 7d)</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {[
            { l: "Solana-first", v: "48%" },
            { l: "Ethereum-first", v: "24%" },
            { l: "Bitcoin-first", v: "18%" },
            { l: "BNB-first", v: "10%" },
          ].map((r) => (
            <div key={r.l} className="rounded-xl bg-muted p-3">
              <p className="text-muted-foreground">{r.l}</p>
              <p className="mt-1 font-display text-lg font-bold">{r.v}</p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
