import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, ShoppingBag, Building2, ShieldAlert, ExternalLink, Link2 } from "lucide-react";
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
}

const APPS: EcosystemApp[] = [
  {
    id: "royal-play",
    name: "Royal Play",
    tagline: "Planned gaming and rewards concept",
    description:
      "A possible future gaming experience. No game integration, verified rewards contract, or ROY reward settlement is connected in this build.",
    icon: Gamepad2,
    gradient: "from-fuchsia-500 to-purple-700",
  },
  {
    id: "marketlink",
    name: "MarketLink",
    tagline: "Planned merchant payment concept",
    description:
      "A possible future marketplace and checkout integration. Merchant onboarding, API key issuance, verified payment callbacks, and settlement are not live.",
    icon: ShoppingBag,
    gradient: "from-blue-500 to-indigo-700",
  },
  {
    id: "amis-properties",
    name: "AMIS Properties",
    tagline: "External property app not linked",
    description:
      "This wallet has no verified integration with AMIS Properties. Property listings, rent/deposit payments, and on-chain settlement are not provided here.",
    icon: Building2,
    gradient: "from-amber-500 to-orange-700",
  },
];

function Ecosystem() {
  const wallet = useStoredWallet();

  return (
    <div className="px-5 pb-10 pt-10">
      <PageHeader
        title="Royal Ecosystem"
        subtitle="Planned integrations across the Royal FinTech product family."
      />

      {wallet && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs">
          <Link2 className="h-4 w-4 shrink-0 text-gold" />
          <p className="text-foreground/80">
            Local Solana address:{" "}
            <span className="font-mono">
              {shortenAddress(wallet.addresses.solana.address, 4, 4)}
            </span>
            . A public address alone does not connect an external app or prove a payment.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {APPS.map((app) => (
          <div
            key={app.id}
            className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft"
          >
            <div className={`bg-gradient-to-br ${app.gradient} p-5 text-white`}>
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                  <app.icon className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
                  Not connected
                </span>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold">{app.name}</h3>
              <p className="mt-0.5 text-xs text-white/80">{app.tagline}</p>
            </div>
            <div className="p-5">
              <p className="text-sm leading-6 text-muted-foreground">{app.description}</p>
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-5 text-muted-foreground">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  No connect button is offered until there is a verified destination, a real
                  integration, and a reviewed payment/signature flow.
                </p>
              </div>
            </div>
          </div>
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
          <p className="text-sm font-semibold">WalletConnect</p>
          <p className="text-xs text-muted-foreground">
            Pair with a compatible dApp; transaction signing is disabled in this build.
          </p>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </Link>

      <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-5 text-center">
        <p className="text-xs leading-5 text-muted-foreground">
          Royal Play, MarketLink, and AMIS Properties are shown as planned or unverified
          integrations. This screen does not establish a live connection, create a merchant API key,
          or confirm any payment.
        </p>
      </div>
    </div>
  );
}
