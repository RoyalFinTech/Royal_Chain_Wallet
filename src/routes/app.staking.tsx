import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Lock,
  TrendingUp,
  Gift,
  Loader2,
  Check,
  X,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useStoredWallet } from "@/hooks/use-wallet";
import { unlockWallet } from "@/lib/wallet";
import { walletService, stakingService } from "@/lib/services";
import type { Validator, StakePosition } from "@/lib/services/stakingService";

export const Route = createFileRoute("/app/staking")({
  component: StakingPage,
});

type StakeSymbol = "SOL" | "ROY";

function StakingPage() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const address = wallet?.addresses.solana.address;

  const summary = useQuery({
    queryKey: ["staking-summary", address],
    enabled: !!address,
    queryFn: () => stakingService.getStakingSummary(address!),
  });
  const positions = useQuery({
    queryKey: ["staking-positions", address],
    enabled: !!address,
    queryFn: () => stakingService.getPositions(address!),
  });
  const validators = useQuery({ queryKey: ["validators"], queryFn: stakingService.getValidators });
  const rewards = useQuery({
    queryKey: ["staking-rewards", address],
    enabled: !!address,
    queryFn: () => stakingService.getRewardHistory(address!),
  });
  const portfolio = useQuery({
    queryKey: ["portfolio", address],
    enabled: !!address,
    queryFn: () => walletService.getPortfolio(wallet!.addresses),
  });

  const [stakeSheet, setStakeSheet] = useState<{
    symbol: StakeSymbol;
    validator?: Validator;
  } | null>(null);
  const [unstakeTarget, setUnstakeTarget] = useState<StakePosition | null>(null);
  const [claiming, setClaiming] = useState<StakeSymbol | null>(null);

  async function claim(symbol: StakeSymbol) {
    setClaiming(symbol);
    try {
      const result = await stakingService.claimRewards(symbol);
      toast.success(`Claimed ${symbol} rewards`, {
        description: `+$${result.claimedUsd.toFixed(2)}`,
      });
      void summary.refetch();
      void rewards.refetch();
    } catch {
      toast.error("Claim failed. Please try again.");
    } finally {
      setClaiming(null);
    }
  }

  if (!wallet) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-xl font-bold">No wallet yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create or import a wallet to start staking.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-14">
      <header className="flex items-center gap-3 px-5 pt-10">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-full glass"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-xl font-bold">Staking</h1>
      </header>

      {/* APY summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 px-5">
        {(summary.data ?? []).map((s) => {
          const balAsset = portfolio.data?.assets.find((a) => a.symbol === s.symbol);
          return (
            <div key={s.symbol} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{s.symbol}</span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                  <TrendingUp className="h-3 w-3" /> {s.apyPct}% APY
                </span>
              </div>
              <p className="mt-2 font-display text-xl font-bold">{s.staked}</p>
              <p className="text-[11px] text-muted-foreground">Staked · +{s.rewards} earned</p>
              <button
                onClick={() => setStakeSheet({ symbol: s.symbol })}
                disabled={!balAsset || balAsset.amount <= 0}
                className="mt-3 grid h-9 w-full place-items-center rounded-xl gradient-gold text-xs font-semibold text-navy shadow-glow disabled:opacity-50"
              >
                Stake
              </button>
            </div>
          );
        })}
      </div>

      {/* Rewards */}
      <div className="mt-6 px-5">
        <div className="rounded-3xl gradient-royal p-5 text-white shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60">Unclaimed rewards</p>
              <p className="mt-1 font-display text-2xl font-bold text-gold-shimmer">
                $
                {(summary.data ?? [])
                  .reduce((s, r) => s + r.rewards * (r.symbol === "SOL" ? 148 : 0.42), 0)
                  .toFixed(2)}
              </p>
            </div>
            <Gift className="h-8 w-8 text-gold" />
          </div>
          <div className="mt-4 flex gap-2">
            {(["SOL", "ROY"] as StakeSymbol[]).map((s) => (
              <button
                key={s}
                onClick={() => void claim(s)}
                disabled={claiming === s}
                className="grid h-10 flex-1 place-items-center rounded-xl gradient-gold text-xs font-semibold text-navy shadow-glow disabled:opacity-60"
              >
                {claiming === s ? <Loader2 className="h-4 w-4 animate-spin" /> : `Claim ${s}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active positions */}
      <div className="mt-6 px-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your Positions
        </h2>
        {positions.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading positions…</p>
        ) : (positions.data ?? []).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-6 text-center">
            <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-xs text-muted-foreground">No active stakes yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(positions.data ?? []).map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {p.amount} {p.symbol}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{p.validator}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${p.status === "active" ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-600"}`}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {p.apyPct.toFixed(1)}% APY · ${p.usdValue.toLocaleString()}
                  </span>
                  {p.status === "unstaking" && p.unlockAt && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Unlocks{" "}
                      {new Date(p.unlockAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {p.status === "active" && (
                  <button
                    onClick={() => setUnstakeTarget(p)}
                    className="mt-3 grid h-9 w-full place-items-center rounded-xl border border-border bg-muted text-xs font-semibold"
                  >
                    Unstake
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validators (SOL) */}
      <div className="mt-6 px-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Solana Validators
        </h2>
        <div className="space-y-2">
          {(validators.data ?? []).map((v) => (
            <button
              key={v.id}
              onClick={() => setStakeSheet({ symbol: "SOL", validator: v })}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:shadow-soft"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{v.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {v.commissionPct}% commission · {v.uptimePct}% uptime
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-success">{v.apyPct}%</p>
                <p className="text-[10px] text-muted-foreground">APY</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reward history */}
      <div className="mt-6 px-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Reward History
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {(rewards.data ?? []).slice(0, 6).map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center justify-between p-3 text-xs ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full ${r.claimed ? "bg-success/10 text-success" : "bg-gold/10 text-gold"}`}
                >
                  <Gift className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium">
                    +{r.amount} {r.symbol}
                  </p>
                  <p className="text-muted-foreground">
                    {new Date(r.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={r.claimed ? "text-muted-foreground" : "font-semibold text-gold"}>
                {r.claimed ? "Claimed" : "Unclaimed"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {stakeSheet && (
        <StakeSheet
          symbol={stakeSheet.symbol}
          validator={stakeSheet.validator}
          available={
            portfolio.data?.assets.find((a) => a.symbol === stakeSheet.symbol)?.amount ?? 0
          }
          onClose={() => setStakeSheet(null)}
          onDone={() => {
            setStakeSheet(null);
            void summary.refetch();
            void positions.refetch();
          }}
        />
      )}

      {unstakeTarget && (
        <UnstakeSheet
          position={unstakeTarget}
          onClose={() => setUnstakeTarget(null)}
          onDone={() => {
            setUnstakeTarget(null);
            void positions.refetch();
          }}
        />
      )}
    </div>
  );
}

function StakeSheet({
  symbol,
  validator,
  available,
  onClose,
  onDone,
}: {
  symbol: StakeSymbol;
  validator?: Validator;
  available: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const wallet = useStoredWallet();
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"amount" | "pin" | "staking" | "done">("amount");
  const [error, setError] = useState<string | null>(null);
  const lockDays = symbol === "SOL" ? 2 : 7;
  const amountOk = Number(amount) > 0 && Number(amount) <= available;

  async function confirm() {
    if (!wallet) return;
    setError(null);
    setStep("staking");
    try {
      await unlockWallet(wallet, pin);
      const { txHash } = await stakingService.stake({
        symbol,
        amount: Number(amount),
        validatorId: validator?.id,
      });
      void txHash;
      setStep("done");
      toast.success(`Staked ${amount} ${symbol}`, {
        description: validator ? validator.name : "Royal Token Staking Program",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Staking failed.";
      setError(message);
      setStep("pin");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl border-t border-border bg-card p-5 sm:mx-auto sm:mb-auto sm:mt-16 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Stake {symbol}</p>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "amount" && (
          <div className="mt-4">
            {validator && (
              <p className="text-xs text-muted-foreground">
                Validator: {validator.name} · {validator.apyPct}% APY
              </p>
            )}
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0.0"
              className="mt-3 w-full rounded-2xl border border-border bg-input/40 px-4 py-3 text-center font-display text-3xl font-bold outline-none"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>
                Available: {available} {symbol}
              </span>
              <button
                onClick={() => setAmount(String(available))}
                className="text-gold hover:underline"
              >
                Max
              </button>
            </div>
            <p className="mt-3 rounded-xl bg-muted p-3 text-[11px] text-muted-foreground">
              Unstaking has a {lockDays}-day cooldown period before funds become liquid again.
            </p>
            <button
              disabled={!amountOk}
              onClick={() => setStep("pin")}
              className="mt-4 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === "pin" && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
              Enter your PIN to confirm staking {amount} {symbol}.
            </p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="mt-3 h-14 w-full rounded-2xl border border-border bg-input/40 text-center font-display text-2xl tracking-[0.5em]"
              placeholder="••••••"
            />
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            <button
              disabled={pin.length !== 6}
              onClick={() => void confirm()}
              className="mt-4 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
            >
              Confirm Stake
            </button>
          </div>
        )}

        {step === "staking" && (
          <div className="grid place-items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="mt-3 text-sm text-muted-foreground">Delegating stake…</p>
          </div>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
              <Check className="h-7 w-7" />
            </div>
            <p className="mt-3 font-display text-lg font-bold">Stake confirmed</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {amount} {symbol} is now earning rewards.
            </p>
            <button
              onClick={onDone}
              className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UnstakeSheet({
  position,
  onClose,
  onDone,
}: {
  position: StakePosition;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<"confirm" | "unstaking" | "done">("confirm");
  const lockDays = position.symbol === "SOL" ? 2 : 7;

  async function confirm() {
    setStep("unstaking");
    try {
      await stakingService.unstake(position.id);
      setStep("done");
      toast.success(`Unstaking ${position.amount} ${position.symbol}`, {
        description: `Available in ~${lockDays} days`,
      });
    } catch {
      toast.error("Unstake failed. Please try again.");
      setStep("confirm");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl border-t border-border bg-card p-5 sm:mx-auto sm:mb-auto sm:mt-16 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "confirm" && (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Unstake {position.symbol}</p>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm">
              You're unstaking{" "}
              <span className="font-semibold">
                {position.amount} {position.symbol}
              </span>{" "}
              from {position.validator}.
            </p>
            <p className="mt-2 rounded-xl bg-amber-500/10 p-3 text-[11px] text-amber-700">
              Funds will be locked for {lockDays} days before becoming available in your wallet.
            </p>
            <button
              onClick={() => void confirm()}
              className="mt-4 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow"
            >
              Confirm Unstake
            </button>
          </div>
        )}
        {step === "unstaking" && (
          <div className="grid place-items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="mt-3 text-sm text-muted-foreground">Submitting unstake request…</p>
          </div>
        )}
        {step === "done" && (
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
              <Check className="h-7 w-7" />
            </div>
            <p className="mt-3 font-display text-lg font-bold">Unstake requested</p>
            <p className="mt-1 text-xs text-muted-foreground">Funds unlock in ~{lockDays} days.</p>
            <button
              onClick={onDone}
              className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
