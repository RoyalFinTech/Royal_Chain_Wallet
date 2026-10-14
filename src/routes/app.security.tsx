import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Lock, ShieldAlert, ShieldCheck, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useStoredWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/app/security")({
  component: Security,
});

function Security() {
  const wallet = useStoredWallet();
  const navigate = useNavigate();

  if (!wallet) {
    return (
      <div className="px-5 pb-10 pt-10">
        <h1 className="font-display text-2xl font-bold">Wallet Security</h1>
        <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-center">
          <Wallet className="mx-auto h-8 w-8 text-gold" />
          <h2 className="mt-3 font-display text-lg font-bold">No local wallet found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create or import a wallet to view its local security options.
          </p>
          <Link
            to="/create-wallet"
            className="mt-5 grid h-12 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy"
          >
            Create wallet
          </Link>
          <Link
            to="/import-wallet"
            className="mt-2 grid h-12 place-items-center rounded-xl border border-border bg-card text-sm font-semibold"
          >
            Import wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-10 pt-10">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/app" })}
          aria-label="Back to dashboard"
          className="grid h-10 w-10 place-items-center rounded-full glass"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">Wallet Security</h1>
          <p className="text-xs text-muted-foreground">
            Actual local wallet controls and limitations
          </p>
        </div>
        <Logo size={34} />
      </header>

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-success/10 text-success">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold">Local wallet storage</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              A locally stored wallet is present. The recovery phrase is encrypted in this browser
              using a key derived from your PIN. Clearing browser data or losing this device without
              a safe backup can permanently remove access.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            to="/app/change-pin"
            className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-gold"
          >
            <Lock className="h-5 w-5 text-gold" />
            <span>
              <span className="block text-sm font-semibold">Change PIN</span>
              <span className="text-xs text-muted-foreground">Re-encrypt this local wallet</span>
            </span>
          </Link>
          <Link
            to="/app/export-phrase"
            className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-gold"
          >
            <KeyRound className="h-5 w-5 text-gold" />
            <span>
              <span className="block text-sm font-semibold">Recovery phrase</span>
              <span className="text-xs text-muted-foreground">
                Reveal only after PIN verification
              </span>
            </span>
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <h2 className="font-display text-base font-bold">Not available in this build</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The app does not yet implement verified biometrics, server-side two-factor authentication,
          real device/session management, live login history, or remote account recovery. This page
          will not show invented devices, IP addresses, approvals, or a synthetic security score.
        </p>
      </section>
    </div>
  );
}
