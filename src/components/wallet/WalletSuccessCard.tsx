import { Check, ShieldCheck } from "lucide-react";
import type { DerivedAddresses } from "@/lib/wallet/derive";

interface Props {
  walletId: string;
  addresses: DerivedAddresses;
}

export function WalletSuccessCard({ walletId, addresses }: Props) {
  const rows = [
    { label: "Bitcoin", address: addresses.bitcoin.address },
    { label: "Ethereum", address: addresses.ethereum.address },
    { label: "BNB Chain", address: addresses.bnb.address },
    { label: "Solana", address: addresses.solana.address },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-success/30 bg-card shadow-elegant">
      <div className="relative gradient-royal p-5 text-white">
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-success/20 text-success ring-1 ring-success/40">
            <Check className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-lg font-bold">Wallet Restored</p>
            <p className="text-xs text-white/70">
              The validated recovery phrase was encrypted locally with your new PIN.
            </p>
          </div>
        </div>
        <div className="relative mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Royal Wallet ID</p>
          <p className="mt-1 font-mono text-sm">{walletId}</p>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Addresses derived from your phrase
        </p>
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs font-semibold">{row.label}</p>
              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{row.address}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border p-3 text-xs text-muted-foreground">
          Recovery phrases contain key material, not account balances or transaction history. Balances and activity must be fetched from the relevant networks; no transfer was made by restoring this wallet.
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-1 text-[11px] font-medium text-success ring-1 ring-success/30">
          <ShieldCheck className="h-3 w-3" /> Keys remain on this device
        </div>
      </div>
    </div>
  );
}
