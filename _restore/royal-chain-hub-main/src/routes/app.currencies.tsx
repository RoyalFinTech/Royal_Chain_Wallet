import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ArrowUpRight, ArrowDownLeft, Repeat } from "lucide-react";
import { CURRENCY_LIST, CURRENCY_BALANCES, formatCurrency, convert } from "@/lib/currencies";

export const Route = createFileRoute("/app/currencies")({
  component: Currencies,
});

function Currencies() {
  const totalUsd = CURRENCY_LIST.reduce(
    (sum, c) => sum + convert(CURRENCY_BALANCES[c.code], c.code, "USD"),
    0,
  );

  return (
    <div className="px-5 pt-10">
      <h1 className="font-display text-2xl font-bold">My Wallets</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hold and manage multiple currencies from one place.
      </p>

      <div className="mt-5 overflow-hidden rounded-3xl gradient-royal p-5 text-white shadow-elegant">
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Estimated total</p>
        <p className="mt-1 font-display text-3xl font-bold text-gold-shimmer">
          {formatCurrency(totalUsd, "USD")}
        </p>
        <p className="mt-1 text-xs text-white/60">Across {CURRENCY_LIST.length} currencies</p>
      </div>

      <div className="mt-6 space-y-2">
        {CURRENCY_LIST.map((c) => (
          <div
            key={c.code}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-lg">
              {c.flag}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {c.code} · <span className="font-normal text-muted-foreground">{c.name}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Rate 1 USD ≈ {c.usdRate.toLocaleString()} {c.code}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-sm font-bold">
                {formatCurrency(CURRENCY_BALANCES[c.code], c.code)}
              </p>
              <div className="mt-1 flex gap-1">
                <Link
                  to="/deposit"
                  className="grid h-7 w-7 place-items-center rounded-full bg-muted"
                >
                  <ArrowDownLeft className="h-3 w-3" />
                </Link>
                <Link to="/send" className="grid h-7 w-7 place-items-center rounded-full bg-muted">
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
                <Link
                  to="/app/exchange"
                  className="grid h-7 w-7 place-items-center rounded-full bg-muted"
                >
                  <Repeat className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-gold hover:text-gold">
        <Plus className="h-4 w-4" /> Add currency wallet
      </button>
    </div>
  );
}
