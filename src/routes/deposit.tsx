import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowDownToLine, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/deposit")({
  component: Deposit,
});

function Deposit() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background px-5 pb-14 pt-10">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-full glass"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-xl font-bold">Add Crypto</h1>
      </header>

      <section className="mt-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold">Fiat deposits are not supported</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Royal Chain Wallet currently focuses on self-custody cryptocurrency. Bank transfers,
          mobile-money deposits, card top-ups, and fiat settlement are not connected. This page will
          not generate a fake deposit receipt or increase your balance.
        </p>
        <Link
          to="/app/receive"
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl gradient-gold px-5 text-sm font-semibold text-navy shadow-glow"
        >
          <ArrowDownToLine className="h-4 w-4" /> Receive Cryptocurrency
        </Link>
      </section>
    </div>
  );
}
