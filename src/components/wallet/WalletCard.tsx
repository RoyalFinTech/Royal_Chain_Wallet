import { Link } from "@tanstack/react-router";
import { ArrowRight, Wallet, ShieldAlert } from "lucide-react";
import { useStoredWallet } from "@/hooks/use-wallet";

interface WalletCardProps {
  walletId?: string;
  address?: string;
  currency?: string;
  onCurrencyChange?: (currency: never) => void;
  balance?: number;
}

/**
 * Legacy component kept for compatibility with older route imports. It never
 * displays stored demo fiat balances; native balances belong in the
 * RPC-backed Crypto Assets view.
 */
export function WalletCard({ walletId, address }: WalletCardProps) {
  const activeWallet = useStoredWallet();
  const derivedAddress = activeWallet?.addresses.solana.address;
  const displayedWalletId =
    walletId ??
    (derivedAddress
      ? `RCW-${derivedAddress.slice(-8, -4).toUpperCase()}-${derivedAddress.slice(-4).toUpperCase()}`
      : null);
  const displayedAddress = address ?? derivedAddress;

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-elegant gradient-royal">
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-80" />
      <div className="relative">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl gradient-gold text-navy">
            <Wallet className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">Royal Chain Wallet</p>
            <p className="mt-1 font-mono text-sm text-white/90">{displayedWalletId ?? "No wallet yet"}</p>
            <p className="mt-1 break-all font-mono text-[11px] text-white/60">
              {displayedAddress ?? "Create or import a wallet to derive your public addresses"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <ShieldAlert className="h-4 w-4 text-gold" />
            {activeWallet ? "On-chain balance status" : "Wallet setup required"}
          </p>
          <p className="mt-2 text-sm leading-5 text-white/70">
            This card no longer shows sample fiat balances. Native crypto balances are shown only
            in the Crypto Assets view when a chain RPC is configured.
          </p>
        </div>

        <Link
          to={activeWallet ? "/app/currencies" : "/create-wallet"}
          className="mt-5 grid h-11 w-full place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy"
        >
          {activeWallet ? "View crypto assets" : "Create wallet"} <ArrowRight className="ml-1 inline h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
