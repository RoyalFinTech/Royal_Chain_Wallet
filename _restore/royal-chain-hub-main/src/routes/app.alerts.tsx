import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Settings,
  CheckCheck,
} from "lucide-react";
import { useStoredWallet, useTransactionHistory } from "@/hooks/use-wallet";
import { ASSET_CATALOG } from "@/lib/services";

export const Route = createFileRoute("/app/alerts")({
  component: AlertsPage,
});

type AlertKind = "tx" | "price" | "security";

interface AlertItem {
  id: string;
  kind: AlertKind;
  title: string;
  detail: string;
  timestamp: number;
  read: boolean;
}

function priceAlerts(seedKey: string): AlertItem[] {
  let h = 0;
  for (let i = 0; i < seedKey.length; i++) h = (h * 31 + seedKey.charCodeAt(i)) >>> 0;
  const symbols = ["BTC", "ETH", "SOL", "ROY"] as const;
  const now = Date.now();
  return symbols.map((s, i) => {
    const up = (h >> i) % 2 === 0;
    const pct = 4 + ((h >> (i + 3)) % 12);
    return {
      id: `price_${s}_${i}`,
      kind: "price" as const,
      title: `${ASSET_CATALOG[s].name} ${up ? "up" : "down"} ${pct}%`,
      detail: `${s} moved ${up ? "+" : "-"}${pct}% in the last 24 hours.`,
      timestamp: now - i * 6 * 3_600_000,
      read: i > 0,
    };
  });
}

const SECURITY_ALERTS: AlertItem[] = [
  {
    id: "sec_1",
    kind: "security",
    title: "New device signed in",
    detail: "MacBook Pro · Serrekunda, GM",
    timestamp: Date.now() - 2 * 3_600_000,
    read: false,
  },
  {
    id: "sec_2",
    kind: "security",
    title: "PIN changed",
    detail: "Your wallet PIN was updated successfully.",
    timestamp: Date.now() - 26 * 3_600_000,
    read: true,
  },
];

function AlertsPage() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const history = useTransactionHistory(wallet);
  const [filter, setFilter] = useState<"all" | AlertKind>("all");

  const txAlerts: AlertItem[] = useMemo(
    () =>
      (history.data ?? []).slice(0, 8).map((tx) => ({
        id: tx.id,
        kind: "tx" as const,
        title: `${tx.direction === "in" ? "Received" : "Sent"} ${tx.amount} ${tx.symbol}`,
        detail: `${tx.direction === "in" ? "From" : "To"} ${tx.counterparty} · ${tx.status}`,
        timestamp: tx.timestamp,
        read: tx.status === "confirmed",
      })),
    [history.data],
  );

  const priceItems = useMemo(
    () => priceAlerts(wallet?.addresses.solana.address ?? "guest"),
    [wallet],
  );

  const all = [...txAlerts, ...priceItems, ...SECURITY_ALERTS].sort(
    (a, b) => b.timestamp - a.timestamp,
  );
  const filtered = filter === "all" ? all : all.filter((a) => a.kind === filter);
  const unreadCount = all.filter((a) => !a.read).length;

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-14">
      <header className="flex items-center gap-3 px-5 pt-10">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-full glass"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-[11px] text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        <Link
          to="/app/notifications"
          aria-label="Notification settings"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </header>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-5">
        {(["all", "tx", "price", "security"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${filter === f ? "border-gold bg-gold/10 text-gold" : "border-border bg-card text-muted-foreground"}`}
          >
            {f === "tx" ? "Transactions" : f}
          </button>
        ))}
      </div>

      <div className="mt-4 px-5">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <CheckCheck className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">You're all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">No notifications in this category.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: AlertItem }) {
  const ICONS: Record<AlertKind, typeof ArrowDownToLine> = {
    tx: alert.title.startsWith("Received") ? ArrowDownToLine : ArrowUpFromLine,
    price: alert.title.includes("up") ? TrendingUp : TrendingDown,
    security: ShieldAlert,
  };
  const COLORS: Record<AlertKind, string> = {
    tx: "bg-emerald-500/10 text-emerald-600",
    price: alert.title.includes("up")
      ? "bg-success/10 text-success"
      : "bg-destructive/10 text-destructive",
    security: "bg-amber-500/10 text-amber-600",
  };
  const Icon = ICONS[alert.kind];
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${alert.read ? "border-border bg-card" : "border-gold/30 bg-gold/5"}`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${COLORS[alert.kind]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{alert.title}</p>
        <p className="text-xs text-muted-foreground">{alert.detail}</p>
      </div>
      <div className="shrink-0 text-right">
        {!alert.read && <span className="mb-1 inline-block h-2 w-2 rounded-full bg-gold" />}
        <p className="text-[10px] text-muted-foreground">
          {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
