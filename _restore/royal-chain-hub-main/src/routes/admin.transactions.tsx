import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AdminPageHeader, AdminCard, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";
import { mockTransactions } from "@/lib/services/mockData";
import type { AssetSymbol, TxStatus } from "@/lib/services/types";

export const Route = createFileRoute("/admin/transactions")({
  component: AdminTransactions,
});

const ALL_SYMBOLS: AssetSymbol[] = ["BTC", "ETH", "BNB", "SOL", "ROY", "USDT", "USDC"];

const STATUS_COLOR: Record<TxStatus, string> = {
  confirmed: "text-success bg-success/10",
  pending: "text-amber-600 bg-amber-500/10",
  failed: "text-destructive bg-destructive/10",
};

function AdminTransactions() {
  const { role } = useAdminRole();
  const [chainFilter, setChainFilter] = useState<"all" | AssetSymbol>("all");
  // Aggregate mock activity across a handful of platform addresses for a
  // realistic-looking system-wide feed.
  const txs = useMemo(() => {
    const seeds = ["platform-a", "platform-b", "platform-c", "platform-d"];
    return seeds
      .flatMap((s) => mockTransactions(s, ALL_SYMBOLS, 8))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, []);
  const filtered = chainFilter === "all" ? txs : txs.filter((t) => t.symbol === chainFilter);

  if (!canAccess(role, "transactions")) return <NoAccess section="Transactions" />;

  return (
    <div>
      <AdminPageHeader
        title="Transactions"
        subtitle="Platform-wide activity across every supported chain"
        action={
          <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
      />

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {(["all", ...ALL_SYMBOLS] as const).map((s) => (
          <button
            key={s}
            onClick={() => setChainFilter(s)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${chainFilter === s ? "border-gold bg-gold/10 text-gold" : "border-border bg-card text-muted-foreground"}`}
          >
            {s === "all" ? "All Assets" : s}
          </button>
        ))}
      </div>

      <AdminCard className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-2 font-medium">Hash</th>
                <th className="py-2 font-medium">Asset</th>
                <th className="py-2 font-medium">Chain</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">USD Value</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map((tx) => (
                <tr key={tx.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 font-mono text-xs">{tx.hash.slice(0, 10)}…</td>
                  <td className="py-3 text-xs font-semibold">{tx.symbol}</td>
                  <td className="py-3 text-xs capitalize text-muted-foreground">{tx.chain}</td>
                  <td className="py-3 text-xs">
                    {tx.direction === "in" ? "+" : "-"}
                    {tx.amount}
                  </td>
                  <td className="py-3 text-xs font-medium">${tx.usdValue.toLocaleString()}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${STATUS_COLOR[tx.status]}`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
