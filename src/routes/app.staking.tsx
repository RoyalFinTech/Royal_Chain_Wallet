import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/app/staking")({
  component: StakingPage,
});

function StakingPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-14 pt-10">
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
          <h1 className="font-display text-xl font-bold">Staking</h1>
          <p className="text-xs text-muted-foreground">On-chain staking is not enabled</p>
        </div>
        <Logo size={34} />
      </header>

      <section className="mt-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
          <Lock className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold">No staking program connected</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This build does not have an audited Solana StakeProgram flow or a Royal Token staking program. Staking balances, APYs, rewards, validators, and transaction hashes must come from a live network—not estimates or generated records—so staking and reward claims are disabled.
        </p>
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-border bg-card p-3 text-left text-xs leading-5 text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>No assets have been staked or locked by viewing this page.</p>
        </div>
        <div className="mt-5 grid gap-2">
          <Link to="/app/tokens" className="grid h-12 place-items-center rounded-xl border border-border bg-card text-sm font-semibold">
            View token status
          </Link>
          <Link to="/app" className="grid h-12 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy shadow-glow">
            Back to wallet
          </Link>
        </div>
      </section>
    </div>
  );
}
