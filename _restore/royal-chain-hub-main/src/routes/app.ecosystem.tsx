import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Gamepad2,
  ShoppingBag,
  Link2,
  Building2,
  Check,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "./app.wallet";
import { useStoredWallet } from "@/hooks/use-wallet";
import { shortenAddress } from "@/lib/wallet";

export const Route = createFileRoute("/app/ecosystem")({
  component: Ecosystem,
});

interface EcosystemApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: typeof Gamepad2;
  gradient: string;
  status: "coming-soon" | "beta";
}

const APPS: EcosystemApp[] = [
  {
    id: "royal-play",
    name: "Royal Play",
    tagline: "Gaming & rewards platform",
    description:
      "Play, compete, and earn ROY rewards across a growing library of games — all settled through your Royal Chain Wallet.",
    icon: Gamepad2,
    gradient: "from-fuchsia-500 to-purple-700",
    status: "coming-soon",
  },
  {
    id: "marketlink",
    name: "MarketLink",
    tagline: "Marketplace payment ecosystem",
    description:
      "A merchant marketplace across The Gambia that settles instantly in BTC, ETH, BNB, SOL, ROY, USDT, or USDC.",
    icon: ShoppingBag,
    gradient: "from-blue-500 to-indigo-700",
    status: "coming-soon",
  },
  {
    id: "amis-properties",
    name: "AMIS Properties",
    tagline: "Digital property ecosystem",
    description:
      "Browse, book, and pay for real estate across The Gambia — deposits, rent, and bookings settled directly on-chain.",
    icon: Building2,
    gradient: "from-amber-500 to-orange-700",
    status: "beta",
  },
];

function Ecosystem() {
  const wallet = useStoredWallet();

  return (
    <div className="px-5 pt-10 pb-10">
      <PageHeader
        title="Royal Ecosystem"
        subtitle="One wallet, connected across every Royal FinTech app."
      />

      {wallet && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs">
          <Sparkles className="h-4 w-4 shrink-0 text-gold" />
          <p className="text-foreground/80">
            Your wallet{" "}
            <span className="font-mono">
              {shortenAddress(wallet.addresses.solana.address, 4, 4)}
            </span>{" "}
            is ready to connect to any ecosystem app below.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {APPS.map((app) => (
          <EcosystemCard key={app.id} app={app} hasWallet={!!wallet} />
        ))}
      </div>

      <Link
        to="/app/walletconnect"
        className="mt-4 flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft transition hover:shadow-elegant"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white">
          <Link2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Connect via WalletConnect</p>
          <p className="text-xs text-muted-foreground">
            Pair with any WalletConnect-compatible dapp
          </p>
        </div>
      </Link>

      <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-5 text-center">
        <p className="text-xs text-muted-foreground">
          Royal Play, MarketLink, and AMIS Properties are separate applications that connect to
          Royal Chain Wallet — they are not built into the wallet itself. Connecting only shares
          your public address; your keys never leave this app.
        </p>
      </div>
    </div>
  );
}

function EcosystemCard({ app, hasWallet }: { app: EcosystemApp; hasWallet: boolean }) {
  const [state, setState] = useState<"idle" | "connecting" | "connected">("idle");
  const Icon = app.icon;

  async function connect() {
    if (!hasWallet || state !== "idle") return;
    setState("connecting");
    await new Promise((r) => setTimeout(r, 900));
    setState("connected");
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <div className={`bg-gradient-to-br ${app.gradient} p-5 text-white`}>
        <div className="flex items-start justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Icon className="h-6 w-6" />
          </span>
          {app.status === "beta" ? (
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
              Beta
            </span>
          ) : (
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
              Coming Soon
            </span>
          )}
        </div>
        <h3 className="mt-3 font-display text-xl font-bold">{app.name}</h3>
        <p className="mt-0.5 text-xs text-white/80">{app.tagline}</p>
      </div>

      <div className="p-5">
        <p className="text-sm text-muted-foreground">{app.description}</p>

        {!hasWallet ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Create or import a wallet to connect.
          </p>
        ) : state === "connected" ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-success/10 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-success">
              <Check className="h-4 w-4" /> Connected
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-success" />
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={state === "connecting"}
            className="mt-4 grid h-12 w-full place-items-center rounded-2xl gradient-gold text-sm font-semibold text-navy shadow-glow disabled:opacity-70"
          >
            {state === "connecting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Connect Wallet"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
