import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useStoredWallet, useTransactionHistory } from "@/hooks/use-wallet";

export const Route = createFileRoute("/app/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const history = useTransactionHistory(wallet);

  const items = useMemo(
    () => (history.data ?? []).slice(0, 20).sort((a, b) => b.timestamp - a.timestamp),
    [history.data],
  );

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-14">
      <header className="flex items-center gap-3 px-5 pt-10">
        <button
          type="button"
          onClick={() => navigate({ to: "/app" })}
          aria-label="Back to dashboard"
          className="grid h-10 w-10 place-items-center rounded-full glass"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold">Wallet Activity</h1>
          <p className="text-[11px] text-muted-foreground">Recorded transaction events only</p>
        </div>
        <Link to="/app/notifications" className="text-xs font-semibold text-gold hover:underline">
          Preferences
        </Link>
      </header>

      <div className="mt-5 px-5">
        {!wallet ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-7 text-center">
            <ShieldAlert className="mx-auto h-7 w-7 text-gold" />
            <h2 className="mt-3 font-display text-lg font-bold">No wallet activity</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Create or import a wallet to begin. This page does not fabricate device alerts,
              logins, or transactions.
            </p>
            <Link
              to="/create-wallet"
              className="mt-4 grid h-11 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy"
            >
              Create wallet
            </Link>
          </div>
        ) : history.isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Loading transaction activity…
          </div>
        ) : history.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
            Could not load transaction activity. Refresh and try again.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-7 text-center">
            <ShieldAlert className="mx-auto h-7 w-7 text-gold" />
            <h2 className="mt-3 font-display text-lg font-bold">You're all caught up</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              No transaction records are available in this browser session. Live price alerts, push
              notifications, and security-event ingestion are not connected.
            </p>
            <Link
              to="/app/receive"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-gold hover:underline"
            >
              Receive crypto <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((tx) => (
              <div
                key={tx.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tx.direction === "in" ? "bg-success/10 text-success" : "bg-gold/10 text-gold"}`}
                >
                  {tx.direction === "in" ? (
                    <ArrowDownToLine className="h-4 w-4" />
                  ) : (
                    <ArrowUpFromLine className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {tx.direction === "in" ? "Received" : "Sent"} {tx.amount} {tx.symbol}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {tx.chain} · {new Date(tx.timestamp).toLocaleString()}
                  </p>
                  <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">
                    {tx.hash}
                  </p>
                  <p className="mt-1 text-[10px] capitalize text-muted-foreground">{tx.status}</p>
                </div>
                <Link
                  to="/app/transactions"
                  aria-label="View transaction details"
                  className="mt-1 text-gold"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
