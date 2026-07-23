import { Eye, EyeOff, ShieldCheck, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  CURRENCIES,
  CURRENCY_BALANCES,
  formatCurrency,
  type CurrencyCode,
  CURRENCY_LIST,
} from "@/lib/currencies";
import { DEMO_IDENTITY } from "@/lib/wallet-identity";

interface WalletCardProps {
  walletId?: string;
  address?: string;
  currency?: CurrencyCode;
  onCurrencyChange?: (c: CurrencyCode) => void;
  balance?: number;
}

export function WalletCard({
  walletId = DEMO_IDENTITY.walletId,
  address = DEMO_IDENTITY.address,
  currency = "USD",
  onCurrencyChange,
  balance,
}: WalletCardProps) {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const value = balance ?? CURRENCY_BALANCES[currency];
  const meta = CURRENCIES[currency];

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-elegant gradient-royal">
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-80" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-gold/10 blur-3xl animate-float-orbit" />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">Royal Wallet ID</p>
          <p className="mt-1 font-mono text-sm text-white/90">{walletId}</p>
          <p className="mt-0.5 font-mono text-[11px] text-white/50">{address}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] text-gold ring-1 ring-gold/40">
          <ShieldCheck className="h-3 w-3" /> Protected
        </span>
      </div>

      <div className="relative mt-7">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">Available balance</p>
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium text-white ring-1 ring-white/15 hover:bg-white/15"
            >
              <span>{meta.flag}</span> {meta.code} <ChevronDown className="h-3 w-3" />
            </button>
            {open && (
              <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-2xl bg-navy/95 p-1 text-xs shadow-elegant ring-1 ring-gold/30 backdrop-blur-xl">
                {CURRENCY_LIST.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      onCurrencyChange?.(c.code);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left hover:bg-white/10 ${c.code === currency ? "text-gold" : "text-white/80"}`}
                  >
                    <span>
                      {c.flag} {c.code}
                    </span>
                    <span className="text-[10px] text-white/50">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-1 flex items-end gap-3">
          <p className="font-display text-4xl font-bold tracking-tight text-gold-shimmer">
            {hidden ? `${meta.symbol}••••••` : formatCurrency(value, currency)}
          </p>
          <button
            onClick={() => setHidden((h) => !h)}
            aria-label="Toggle balance"
            className="mb-1 text-white/60 hover:text-white"
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-between text-xs text-white/60">
        <span className="font-mono">•••• {walletId.slice(-4)}</span>
        <span className="font-display tracking-[0.35em]">ROYAL</span>
      </div>
    </div>
  );
}
