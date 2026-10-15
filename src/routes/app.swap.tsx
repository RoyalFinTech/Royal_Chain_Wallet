import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowDown,
  Settings2,
  RefreshCw,
  ChevronDown,
  X,
  Check,
  Loader2,
  Route as RouteIcon,
} from "lucide-react";
import { useStoredWallet } from "@/hooks/use-wallet";
import { unlockWallet } from "@/lib/wallet";
import { walletService, transactionService, ASSET_CATALOG } from "@/lib/services";
import type { AssetBalance, AssetSymbol, QuoteResult } from "@/lib/services/types";

export const Route = createFileRoute("/app/swap")({
  component: SwapPage,
});

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0];
const QUOTE_TTL_SECONDS = 20;
const SWAP_ROUTING_ENABLED = false; // No audited on-chain DEX route is connected yet.

function SwapPage() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const portfolio = useQuery({
    queryKey: ["portfolio", wallet?.addresses.solana.address],
    enabled: !!wallet,
    queryFn: () => walletService.getPortfolio(wallet!.addresses),
  });

  const [fromSymbol, setFromSymbol] = useState<AssetSymbol>("SOL");
  const [toSymbol, setToSymbol] = useState<AssetSymbol>("ROY");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [pickerOpen, setPickerOpen] = useState<"from" | "to" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const assets = portfolio.data?.assets ?? [];
  const fromAsset = assets.find((a) => a.symbol === fromSymbol);
  const effectiveSlippage = customSlippage ? Number(customSlippage) : slippage;

  const quote = useQuery({
    queryKey: ["swap-quote", fromSymbol, toSymbol, amount],
    enabled: Number(amount) > 0,
    queryFn: () => transactionService.getSwapQuote(fromSymbol, toSymbol, Number(amount)),
    refetchInterval: QUOTE_TTL_SECONDS * 1000,
  });

  const [secondsLeft, setSecondsLeft] = useState(QUOTE_TTL_SECONDS);
  useEffect(() => {
    if (!quote.data) return;
    setSecondsLeft(QUOTE_TTL_SECONDS);
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [quote.data, quote.dataUpdatedAt]);

  const priceImpactPct = useMemo(() => {
    if (!quote.data) return 0;
    // Larger trades relative to a notional pool depth show more impact — purely illustrative.
    const notional = quote.data.fromAmount * (ASSET_CATALOG[fromSymbol] ? 1 : 1);
    void notional;
    return Math.min(0.02 + Number(amount || 0) * 0.0008, 4.5);
  }, [quote.data, amount, fromSymbol]);

  const insufficientBalance = fromAsset ? Number(amount) > fromAsset.amount : false;
  const canReview =
    SWAP_ROUTING_ENABLED && !!wallet && Number(amount) > 0 && !insufficientBalance && !!quote.data;

  function flip() {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setAmount("");
  }

  if (!wallet) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-xl font-bold">No wallet yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create or import a wallet to swap assets.
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
        <h1 className="font-display text-xl font-bold">Swap</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
          aria-label="Swap settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </header>

      <div className="px-5 pt-6">
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-5 text-muted-foreground">
          <p className="font-semibold text-foreground">Swap preview only</p>
          <p className="mt-1">
            Rates and charts below use sample prices. A live swap router, on-chain quote
            verification, and signed swap instructions are not configured. This screen cannot move
            assets yet.
          </p>
        </div>
        {/* From */}
        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>You pay</span>
            <span>Balance: {fromAsset ? `${fromAsset.amount} ${fromSymbol}` : "—"}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0.0"
              className="w-full bg-transparent font-display text-3xl font-bold outline-none placeholder:text-muted-foreground/40"
            />
            <TokenPickerButton symbol={fromSymbol} onClick={() => setPickerOpen("from")} />
          </div>
          {fromAsset && (
            <button
              onClick={() => setAmount(String(fromAsset.amount))}
              className="mt-1 text-[11px] font-medium text-gold hover:underline"
            >
              Max
            </button>
          )}
          {insufficientBalance && (
            <p className="mt-1 text-xs text-destructive">Insufficient balance</p>
          )}
        </div>

        <div className="relative flex justify-center">
          <button
            onClick={flip}
            aria-label="Flip assets"
            className="-my-3 grid h-10 w-10 place-items-center rounded-full gradient-gold text-navy shadow-glow ring-4 ring-background"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        {/* To */}
        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>You receive (estimated)</span>
            {quote.isFetching && <RefreshCw className="h-3 w-3 animate-spin" />}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="w-full truncate font-display text-3xl font-bold text-gold-shimmer">
              {quote.data ? quote.data.toAmount : "0.0"}
            </p>
            <TokenPickerButton symbol={toSymbol} onClick={() => setPickerOpen("to")} />
          </div>
        </div>

        {quote.data && (
          <div className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-4 text-xs">
            <Row
              label="Rate"
              value={`1 ${fromSymbol} ≈ ${quote.data.rate.toFixed(6)} ${toSymbol}`}
            />
            <Row
              label="Price impact"
              value={`${priceImpactPct.toFixed(2)}%`}
              warn={priceImpactPct > 2}
            />
            <Row label="Slippage tolerance" value={`${effectiveSlippage}%`} />
            <Row label="Network fee" value={`~$${quote.data.networkFeeUsd.toFixed(2)}`} />
            <div className="flex items-center justify-between border-t border-dashed border-border pt-2">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <RouteIcon className="h-3.5 w-3.5" /> Best route
              </span>
              <span className="font-medium">
                {fromSymbol} → {toSymbol} · Router not connected
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Quote refreshes automatically</span>
              <span>{secondsLeft}s</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gold transition-all duration-1000 ease-linear"
                style={{ width: `${(secondsLeft / QUOTE_TTL_SECONDS) * 100}%` }}
              />
            </div>
          </div>
        )}

        <button
          disabled={!canReview}
          onClick={() => setConfirmOpen(true)}
          className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
        >
          {!SWAP_ROUTING_ENABLED
            ? "Live swap routing not configured"
            : !amount
              ? "Enter an amount"
              : insufficientBalance
                ? "Insufficient balance"
                : "Review Swap"}
        </button>
      </div>

      {pickerOpen && (
        <TokenPicker
          assets={assets}
          exclude={pickerOpen === "from" ? toSymbol : fromSymbol}
          onSelect={(s) => {
            if (pickerOpen === "from") setFromSymbol(s);
            else setToSymbol(s);
            setPickerOpen(null);
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}

      {settingsOpen && (
        <SlippageSheet
          slippage={slippage}
          custom={customSlippage}
          onSlippage={(v) => {
            setSlippage(v);
            setCustomSlippage("");
          }}
          onCustom={setCustomSlippage}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {confirmOpen && quote.data && fromAsset && (
        <ConfirmSwapSheet
          quote={quote.data}
          fromAsset={fromAsset}
          slippagePct={effectiveSlippage}
          walletAddress={wallet.addresses.solana.address}
          onClose={() => setConfirmOpen(false)}
          onDone={() => {
            setConfirmOpen(false);
            setAmount("");
            void portfolio.refetch();
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${warn ? "text-amber-600" : ""}`}>{value}</span>
    </div>
  );
}

function TokenPickerButton({ symbol, onClick }: { symbol: AssetSymbol; onClick: () => void }) {
  const meta = ASSET_CATALOG[symbol];
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1.5"
    >
      <span
        className={`grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br ${meta.iconGradient} text-[8px] font-bold text-white`}
      >
        {symbol.slice(0, 1)}
      </span>
      <span className="text-sm font-semibold">{symbol}</span>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

function TokenPicker({
  assets,
  exclude,
  onSelect,
  onClose,
}: {
  assets: AssetBalance[];
  exclude: AssetSymbol;
  onSelect: (s: AssetSymbol) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl border-t border-border bg-card p-5 sm:mx-auto sm:mb-auto sm:mt-16 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Select a token</p>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 max-h-80 space-y-1.5 overflow-y-auto">
          {(Object.keys(ASSET_CATALOG) as AssetSymbol[])
            .filter((s) => s !== exclude)
            .map((s) => {
              const meta = ASSET_CATALOG[s];
              const bal = assets.find((a) => a.symbol === s);
              return (
                <button
                  key={s}
                  onClick={() => onSelect(s)}
                  className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left hover:bg-muted"
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${meta.iconGradient} text-[10px] font-bold text-white`}
                  >
                    {s.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{meta.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s}</p>
                  </div>
                  {bal && <p className="text-xs text-muted-foreground">{bal.amount}</p>}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function SlippageSheet({
  slippage,
  custom,
  onSlippage,
  onCustom,
  onClose,
}: {
  slippage: number;
  custom: string;
  onSlippage: (v: number) => void;
  onCustom: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl border-t border-border bg-card p-5 sm:mx-auto sm:mb-auto sm:mt-16 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Slippage tolerance</p>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          {SLIPPAGE_OPTIONS.map((v) => (
            <button
              key={v}
              onClick={() => onSlippage(v)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold ${!custom && slippage === v ? "border-gold bg-gold/10 text-gold" : "border-border"}`}
            >
              {v}%
            </button>
          ))}
          <input
            value={custom}
            onChange={(e) => onCustom(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Custom"
            className={`w-20 rounded-xl border px-2 text-center text-sm ${custom ? "border-gold bg-gold/10" : "border-border bg-input/40"}`}
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Your swap will revert if the price changes unfavorably by more than this percentage.
        </p>
        <button
          onClick={onClose}
          className="mt-4 grid h-12 w-full place-items-center rounded-2xl gradient-gold text-sm font-semibold text-navy shadow-glow"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function ConfirmSwapSheet({
  quote,
  fromAsset,
  slippagePct,
  walletAddress,
  onClose,
  onDone,
}: {
  quote: QuoteResult;
  fromAsset: AssetBalance;
  slippagePct: number;
  walletAddress: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const wallet = useStoredWallet();
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"review" | "pin" | "swapping" | "done">("review");
  const [error, setError] = useState<string | null>(null);
  const minReceived = quote.toAmount * (1 - slippagePct / 100);

  async function confirm() {
    if (!wallet) return;
    setError(null);
    setStep("swapping");
    try {
      await unlockWallet(wallet, pin);
      // The quote is illustrative only. Never turn PIN verification into a
      // fake successful swap without a signed, broadcast on-chain route.
      throw new Error(
        "On-chain swap routing is not configured. This quote is a preview; no assets were moved.",
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Swap failed.";
      setError(message);
      setStep("pin");
      toast.error("Swap failed", { description: message });
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl border-t border-border bg-card p-5 sm:mx-auto sm:mb-auto sm:mt-16 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "review" && (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Confirm Swap</p>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Pay" value={`${quote.fromAmount} ${quote.fromSymbol}`} />
              <Row label="Receive (est.)" value={`${quote.toAmount} ${quote.toSymbol}`} />
              <Row label="Minimum received" value={`${minReceived.toFixed(6)} ${quote.toSymbol}`} />
              <Row label="Slippage" value={`${slippagePct}%`} />
              <Row label="Network fee" value={`~$${quote.networkFeeUsd.toFixed(2)}`} />
              <Row label="From" value={walletAddress.slice(0, 6) + "…" + walletAddress.slice(-4)} />
            </div>
            <button
              onClick={() => setStep("pin")}
              className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow"
            >
              Confirm & Sign
            </button>
          </div>
        )}

        {step === "pin" && (
          <div>
            <p className="text-sm font-semibold">Enter your PIN</p>
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
              Swap Now
            </button>
          </div>
        )}

        {step === "swapping" && (
          <div className="grid place-items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="mt-3 text-sm text-muted-foreground">Routing your swap…</p>
          </div>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
              <Check className="h-7 w-7" />
            </div>
            <p className="mt-3 font-display text-lg font-bold">Swap complete</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {quote.fromAmount} {quote.fromSymbol} → {quote.toAmount} {quote.toSymbol}
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
