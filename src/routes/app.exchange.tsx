import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, Repeat, ShieldCheck } from "lucide-react";
import {
  CURRENCY_LIST,
  CURRENCIES,
  convert,
  formatCurrency,
  type CurrencyCode,
} from "@/lib/currencies";

export const Route = createFileRoute("/app/exchange")({
  component: Exchange,
});

function Exchange() {
  const [from, setFrom] = useState<CurrencyCode>("USD");
  const [to, setTo] = useState<CurrencyCode>("EUR");
  const [amount, setAmount] = useState("100");
  const converted = amount ? convert(Number(amount) || 0, from, to) : 0;
  const fee = (Number(amount) || 0) * 0.005;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="px-5 pt-10">
      <h1 className="font-display text-2xl font-bold">Currency Exchange</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Convert between currencies at live rates.
      </p>

      <div className="mt-6 space-y-3">
        <ExchangeSide
          label="You send"
          currency={from}
          onCurrency={setFrom}
          amount={amount}
          onAmount={setAmount}
        />

        <div className="relative flex justify-center">
          <button
            onClick={swap}
            className="grid h-10 w-10 place-items-center rounded-full gradient-gold text-navy shadow-glow ring-4 ring-background"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        <ExchangeSide
          label="You receive"
          currency={to}
          onCurrency={setTo}
          amount={converted.toFixed(2)}
          readOnly
        />
      </div>

      <div className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <Row
          label="Rate"
          value={`1 ${from} ≈ ${(CURRENCIES[to].usdRate / CURRENCIES[from].usdRate).toFixed(4)} ${to}`}
        />
        <Row label="Fee (0.5%)" value={formatCurrency(fee, from)} />
        <Row label="You get" value={formatCurrency(converted, to)} bold />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-xs text-success">
        <ShieldCheck className="h-4 w-4" /> Locked rate for 30 seconds · No hidden markups
      </div>

      <button className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow">
        <span className="inline-flex items-center gap-2">
          <Repeat className="h-4 w-4" /> Exchange now
        </span>
      </button>
    </div>
  );
}

function ExchangeSide({
  label,
  currency,
  onCurrency,
  amount,
  onAmount,
  readOnly,
}: {
  label: string;
  currency: CurrencyCode;
  onCurrency: (c: CurrencyCode) => void;
  amount: string;
  onAmount?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <select
          value={currency}
          onChange={(e) => onCurrency(e.target.value as CurrencyCode)}
          className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium"
        >
          {CURRENCY_LIST.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
      </div>
      <input
        inputMode="decimal"
        value={amount}
        readOnly={readOnly}
        onChange={(e) => onAmount?.(e.target.value.replace(/[^\d.]/g, ""))}
        className="mt-2 w-full bg-transparent font-display text-3xl font-bold outline-none"
      />
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-display text-base font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}
