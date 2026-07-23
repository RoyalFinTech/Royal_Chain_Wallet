import { createFileRoute } from "@tanstack/react-router";
import { Landmark, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { AdminPageHeader, AdminCard, StatTile, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";
import { ASSET_CATALOG } from "@/lib/services";

export const Route = createFileRoute("/admin/treasury")({
  component: AdminTreasury,
});

const pools = [
  { symbol: "BTC" as const, amount: 12.4, usd: 796_080 },
  { symbol: "ETH" as const, amount: 148.2, usd: 471_276 },
  { symbol: "SOL" as const, amount: 2840, usd: 420_320 },
  { symbol: "USDT" as const, amount: 310_000, usd: 310_000 },
  { symbol: "USDC" as const, amount: 265_000, usd: 265_000 },
  { symbol: "ROY" as const, amount: 4_200_000, usd: 1_764_000 },
];

const totalUsd = pools.reduce((s, p) => s + p.usd, 0);

function AdminTreasury() {
  const { role } = useAdminRole();
  if (!canAccess(role, "treasury")) return <NoAccess section="Treasury" />;

  return (
    <div>
      <AdminPageHeader title="Treasury" subtitle="Reserve holdings across every chain" />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Total Reserves"
          value={`$${totalUsd.toLocaleString()}`}
          icon={Landmark}
          trend="+2.8%"
        />
        <StatTile label="Inflows (30d)" value="$412,900" icon={ArrowDownToLine} trend="+9.4%" />
        <StatTile label="Outflows (30d)" value="$198,220" icon={ArrowUpFromLine} trend="-3.1%" />
      </div>

      <AdminCard className="mt-6">
        <h2 className="font-display text-base font-bold">Reserve Pools</h2>
        <div className="mt-4 space-y-2">
          {pools.map((p) => {
            const meta = ASSET_CATALOG[p.symbol];
            const pct = (p.usd / totalUsd) * 100;
            return (
              <div
                key={p.symbol}
                className="flex items-center gap-3 rounded-2xl border border-border p-3"
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${meta.iconGradient} text-white text-[10px] font-bold`}
                >
                  {p.symbol.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{meta.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.amount.toLocaleString()} {p.symbol}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${p.usd.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}% of reserves</p>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>
    </div>
  );
}
