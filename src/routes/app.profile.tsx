import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownToLine, ArrowRight, Check, Copy, ExternalLink, ShieldCheck, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useStoredWallet } from "@/hooks/use-wallet";
import { shortenAddress } from "@/lib/wallet";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
});

const CHAINS = [
  { id: "bitcoin", label: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", label: "Ethereum", symbol: "ETH" },
  { id: "bnb", label: "BNB Chain", symbol: "BNB" },
  { id: "solana", label: "Solana", symbol: "SOL" },
] as const;

function Profile() {
  const wallet = useStoredWallet();
  const [copied, setCopied] = useState<string | null>(null);
  const walletId = wallet
    ? `RCW-${wallet.addresses.solana.address.slice(-8, -4).toUpperCase()}-${wallet.addresses.solana.address.slice(-4).toUpperCase()}`
    : null;

  async function copyAddress(chain: (typeof CHAINS)[number]["id"], address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(chain);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  if (!wallet) {
    return (
      <div className="px-5 pb-10 pt-10">
        <Logo size={48} withText />
        <h1 className="mt-6 font-display text-2xl font-bold">Your Wallet</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This is a self-custody crypto wallet. Create or import a wallet before viewing your local public addresses.
        </p>
        <Link to="/create-wallet" className="mt-5 grid h-12 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy shadow-glow">Create wallet</Link>
        <Link to="/import-wallet" className="mt-2 grid h-12 place-items-center rounded-xl border border-border bg-card text-sm font-semibold">Import wallet</Link>
      </div>
    );
  }

  return (
    <div className="px-5 pb-10 pt-10">
      <header className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Logo size={38} withText />
          <h1 className="mt-4 font-display text-2xl font-bold">Wallet Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Public addresses for this locally stored wallet</p>
        </div>
      </header>

      <section className="mt-5 overflow-hidden rounded-3xl gradient-royal p-5 text-white shadow-elegant">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-gold/35">
            <Wallet className="h-6 w-6 text-gold" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Local wallet ID</p>
            <p className="mt-1 font-mono text-sm font-semibold">{walletId}</p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-white/70">
          This ID is a convenience label derived from the Solana address; it is not an account number, a deposit reference, or proof of identity.
        </p>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Blockchain addresses</h2>
          <Link to="/app/receive" className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
            Receive <ArrowDownToLine className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {CHAINS.map(({ id, label, symbol }) => {
            const address = wallet.addresses[id].address;
            return (
              <div key={id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{symbol}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyAddress(id, address)}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold"
                  >
                    {copied === id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-gold" />}
                    {copied === id ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-3 break-all rounded-xl bg-muted/40 p-3 font-mono text-[11px] leading-5">{address}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">Short: {shortenAddress(address, 7, 7)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-amber-500/25 bg-amber-500/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-amber-600" /> Self-custody reminder</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Your recovery phrase controls this wallet. Never share it. Always match the receiving address to the correct network before sending funds.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <Link to="/app/security" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <ShieldCheck className="h-5 w-5 text-gold" />
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Wallet security</span><span className="text-xs text-muted-foreground">Change PIN or review recovery phrase options</span></span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/app/settings" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <ExternalLink className="h-5 w-5 text-gold" />
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">App settings</span><span className="text-xs text-muted-foreground">Language, display currency, theme</span></span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/app/transactions" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Wallet className="h-5 w-5 text-gold" />
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Transaction activity</span><span className="text-xs text-muted-foreground">Hashes captured by the current app session</span></span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>
    </div>
  );
}
