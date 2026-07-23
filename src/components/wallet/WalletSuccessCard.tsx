import { Check, ShieldCheck } from "lucide-react";
import { CURRENCIES, CURRENCY_BALANCES, formatCurrency, type CurrencyCode } from "@/lib/currencies";

interface Props {
  walletId: string;
  address: string;
  currencies?: CurrencyCode[];
  txCount?: number;
  services?: string[];
}

export function WalletSuccessCard({
  walletId,
  address,
  currencies = ["USD", "EUR", "GBP", "GMD"],
  txCount = 128,
  services = ["Wave", "AfriMoney", "Visa Card"],
}: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-success/30 bg-card shadow-elegant">
      <div className="relative gradient-royal p-5 text-white">
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-success/20 text-success ring-1 ring-success/40">
            <Check className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-lg font-bold">Wallet Found Successfully</p>
            <p className="text-xs text-white/70">
              Your Royal Chain Wallet has been restored on this device.
            </p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Royal Wallet ID</p>
            <p className="mt-1 font-mono text-sm">{walletId}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Wallet Address</p>
            <p className="mt-1 font-mono text-sm">{address}</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Restored assets
        </p>
        <div className="mt-2 space-y-1.5">
          {currencies.map((c) => {
            const meta = CURRENCIES[c];
            return (
              <div
                key={c}
                className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span>{meta.flag}</span>
                  <span className="font-medium">{meta.name}</span>
                </span>
                <span className="font-mono font-semibold">
                  {formatCurrency(CURRENCY_BALANCES[c], c)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-border p-3">
            <p className="text-muted-foreground">Transaction history</p>
            <p className="mt-1 font-display text-lg font-bold">{txCount}</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-muted-foreground">Connected services</p>
            <p className="mt-1 truncate font-display text-sm font-bold">{services.join(" · ")}</p>
          </div>
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-1 text-[11px] font-medium text-success ring-1 ring-success/30">
          <ShieldCheck className="h-3 w-3" /> Verified locally · Keys never leave this device
        </div>
      </div>
    </div>
  );
}
