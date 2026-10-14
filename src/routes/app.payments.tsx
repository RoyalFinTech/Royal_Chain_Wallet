import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "./app.wallet";
import { ArrowDownToLine, ArrowLeftRight, Code2, ExternalLink, QrCode, ShieldCheck, Send, Wallet, KeyRound } from "lucide-react";

export const Route = createFileRoute("/app/payments")({
  component: Payments,
});

const cryptoTools = [
  { to: "/send", name: "Send Crypto", description: "Review the recipient and network before signing.", icon: Send },
  { to: "/app/receive", name: "Receive Crypto", description: "Show a real wallet-address QR code.", icon: ArrowDownToLine },
  { to: "/qr", name: "QR Tools", description: "Copy, share, save, or scan wallet QR codes.", icon: QrCode },
  { to: "/app/tokens", name: "Token Balances", description: "View tokens when the SPL reader is configured.", icon: Wallet },
  { to: "/app/walletconnect", name: "WalletConnect", description: "Pair with supported dApps; transaction signing is restricted.", icon: Code2 },
  { to: "/app/transactions", name: "Transaction Activity", description: "Review transaction hashes and statuses recorded by this build.", icon: ShieldCheck },
  { to: "/app/swap", name: "Swap Preview", description: "Sample quote UI only; live swap routing is not configured.", icon: ArrowLeftRight },
];

function Payments() {
  return (
    <div className="px-5 pb-10 pt-10">
      <PageHeader title="Crypto tools" subtitle="Manage self-custody cryptocurrency across supported blockchains." />

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        {cryptoTools.map(({ to, name, description, icon: Icon }) => (
          <Link
            key={name}
            to={to}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{name}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-6 rounded-3xl border border-amber-500/25 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h2 className="font-display text-base font-bold">Merchant payment API</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Merchant checkout is not enabled yet. A production API key needs server-side key issuance, scoped permissions, hashed storage, revocation, replay protection, and payment-status callbacks. No placeholder key is being shown as if it could process real payments.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Until that backend is implemented and tested, third-party apps must not treat a wallet address or a client-side response as proof of payment.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5">
        <Link to="/app/security" className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
          Review wallet security <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
