import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader, AdminCard, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";
import {
  bitcoinService,
  ethereumService,
  bnbService,
  solanaService,
  ASSET_CATALOG,
} from "@/lib/services";
import type { NetworkStatus } from "@/lib/services/types";

export const Route = createFileRoute("/admin/networks")({
  component: AdminNetworks,
});

const CONGESTION_COLOR: Record<NetworkStatus["congestion"], string> = {
  low: "text-success bg-success/10",
  moderate: "text-amber-600 bg-amber-500/10",
  high: "text-destructive bg-destructive/10",
};

function AdminNetworks() {
  const { role } = useAdminRole();
  const networks = useQuery({
    queryKey: ["admin-networks"],
    refetchInterval: 30_000,
    queryFn: async () => ({
      bitcoin: await bitcoinService.getNetworkStatus(),
      ethereum: await ethereumService.getNetworkStatus(),
      bnb: await bnbService.getNetworkStatus(),
      solana: await solanaService.getNetworkStatus(),
    }),
  });

  if (!canAccess(role, "networks")) return <NoAccess section="Networks" />;

  const rows = networks.data
    ? [
        { symbol: "BTC" as const, status: networks.data.bitcoin },
        { symbol: "ETH" as const, status: networks.data.ethereum },
        { symbol: "BNB" as const, status: networks.data.bnb },
        { symbol: "SOL" as const, status: networks.data.solana },
      ]
    : [];

  return (
    <div>
      <AdminPageHeader
        title="Supported Networks"
        subtitle="Live status across every integrated blockchain"
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {networks.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading network status…</p>
        ) : (
          rows.map(({ symbol, status }) => {
            const meta = ASSET_CATALOG[symbol];
            return (
              <AdminCard key={symbol}>
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${meta.iconGradient} text-white text-[10px] font-bold`}
                  >
                    {symbol.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{meta.name}</p>
                    <p className="text-[10px] text-muted-foreground">{status.label}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Block height</span>
                    <span className="font-medium">{status.blockHeight.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. fee</span>
                    <span className="font-medium">${status.avgFeeUsd}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Congestion</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${CONGESTION_COLOR[status.congestion]}`}
                    >
                      {status.congestion}
                    </span>
                  </div>
                </div>
              </AdminCard>
            );
          })
        )}
      </div>

      <AdminCard className="mt-4">
        <p className="text-xs text-muted-foreground">
          Network endpoints are environment-configured (e.g.{" "}
          <code className="rounded bg-muted px-1 py-0.5">VITE_SOL_RPC_URL</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">VITE_ETH_RPC_URL</code>) and never
          hardcoded. Currently showing demo status while live providers are being connected — see{" "}
          <code className="rounded bg-muted px-1 py-0.5">src/lib/services</code>.
        </p>
      </AdminCard>
    </div>
  );
}
