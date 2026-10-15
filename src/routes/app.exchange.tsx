import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, ArrowLeft, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/app/exchange")({
  component: Exchange,
});

function Exchange() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-14 pt-10">
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Back to wallet"
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-full glass"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold">Exchange</h1>
          <p className="text-xs text-muted-foreground">Crypto only</p>
        </div>
        <Logo size={34} />
      </header>

      <section className="mt-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
          <ArrowLeftRight className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold">Fiat exchange is not supported</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This page previously displayed static fiat conversion rates as though they were live. That
          exchange flow has been removed. Royal Chain Wallet focuses on multi-chain cryptocurrency;
          live crypto swap routing is also not connected yet.
        </p>
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-border bg-card p-3 text-left text-xs leading-5 text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>No conversion or asset movement occurs on this screen.</p>
        </div>
        <div className="mt-5 grid gap-2">
          <Link
            to="/app/swap"
            className="grid h-12 place-items-center rounded-xl border border-border bg-card text-sm font-semibold"
          >
            View crypto swap preview
          </Link>
          <Link
            to="/app"
            className="grid h-12 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy shadow-glow"
          >
            Back to wallet
          </Link>
        </div>
      </section>
    </div>
  );
}
