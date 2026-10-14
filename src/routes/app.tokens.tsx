import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Coins, RefreshCw, Send, Loader2, X, Check, ExternalLink } from "lucide-react";
import { useStoredWallet } from "@/hooks/use-wallet";
import { unlockWallet, shortenAddress, type StoredWallet } from "@/lib/wallet";
import { tokenService, transactionService, ASSET_CATALOG, type AssetBalance } from "@/lib/services";
import { useQuery } from "@tanstack/react-query";
import { SkeletonLine } from "@/components/ui/skeletons";

export const Route = createFileRoute("/app/tokens")({
  component: TokensPage,
});

function TokensPage() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const solAddress = wallet?.addresses.solana.address;
  const tokens = useQuery({
    queryKey: ["spl-tokens", solAddress],
    enabled: !!solAddress,
    refetchInterval: 30_000,
    queryFn: () => tokenService.getTokenBalances(solAddress!),
  });
  const [selected, setSelected] = useState<AssetBalance | null>(null);

  const balances = tokens.data ?? [];

  if (!wallet) {
    return (
      <div className="px-5 pt-10">
        <h1 className="font-display text-2xl font-bold">Tokens</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a wallet to view your SPL tokens.
        </p>
        <Link
          to="/create-wallet"
          className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow"
        >
          Create a Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-10">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">Tokens</h1>
          <p className="text-xs text-muted-foreground">SPL tokens on Solana · integration not enabled</p>
        </div>
        <button
          onClick={() => void tokens.refetch()}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${tokens.isFetching ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div className="mt-6 space-y-2">
        {tokens.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <SkeletonLine className="h-4 w-32" />
              <SkeletonLine className="mt-2 h-3 w-20" />
            </div>
          ))
        ) : balances.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-gold">
              <Coins className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold">No tokens yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The live SPL token-account reader is not connected in this build. No token balances are fabricated, and token transfers stay disabled until mint addresses and signing are verified.
            </p>
          </div>
        ) : (
          balances.map((b) => {
            const meta = ASSET_CATALOG[b.symbol];
            return (
              <button
                key={b.symbol}
                onClick={() => setSelected(b)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:shadow-soft"
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${meta.iconGradient} text-white font-display text-xs font-bold`}
                >
                  {b.symbol.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{meta.name}</p>
                  <p className="text-[11px] text-muted-foreground">{b.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-bold">{b.amount}</p>
                  <p className="text-[10px] text-muted-foreground">
                    ${b.usdValue.toLocaleString()}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selected && (
        <TokenSendSheet
          asset={selected}
          wallet={wallet}
          onClose={() => setSelected(null)}
          onSent={() => {
            setSelected(null);
            void tokens.refetch();
          }}
        />
      )}
    </div>
  );
}

function TokenSendSheet({
  asset,
  wallet,
  onClose,
  onSent,
}: {
  asset: AssetBalance;
  wallet: StoredWallet;
  onClose: () => void;
  onSent: () => void;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"form" | "pin" | "sending" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const canProceed = to.trim().length > 0 && Number(amount) > 0 && Number(amount) <= asset.amount;

  async function submit() {
    setError(null);
    setStep("sending");
    try {
      await unlockWallet(wallet, pin); // verifies PIN, decrypts locally — never leaves device
      const record = await transactionService.submitTransfer({
        fromAddress: wallet.addresses.solana.address,
        toAddress: to.trim(),
        symbol: asset.symbol,
        chain: "solana",
        amount: Number(amount),
        usdValue: Number(amount) * asset.usdPrice,
      });
      setHash(record.hash);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfer failed.");
      setStep("pin");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid items-end justify-items-stretch bg-black/60 motion-backdrop-in"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl border-t border-border bg-card p-5 motion-sheet-in sm:mx-auto sm:mb-auto sm:mt-16 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${ASSET_CATALOG[asset.symbol].iconGradient} text-white text-[10px] font-bold`}
            >
              {asset.symbol.slice(0, 1)}
            </span>
            <div>
              <p className="text-sm font-semibold">Send {asset.symbol}</p>
              <p className="text-[10px] text-muted-foreground">
                Balance {asset.amount} {asset.symbol}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "form" && (
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">
                Recipient Solana address
              </span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Solana address"
                className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-4 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold/60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">
                Amount ({asset.symbol})
              </span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0.0"
                className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
              />
            </label>
            <p className="text-[11px] text-muted-foreground">
              Network fee: ~0.02 USD equivalent (Solana).
            </p>
            <button
              disabled={!canProceed}
              onClick={() => setStep("pin")}
              className="grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
            >
              Review & Sign
            </button>
          </div>
        )}

        {step === "pin" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">Enter your PIN to sign this transfer.</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="h-14 w-full rounded-2xl border border-border bg-input/40 text-center text-2xl tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-gold/60"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setStep("form")}
                className="grid h-14 flex-1 place-items-center rounded-2xl border border-border bg-card font-semibold"
              >
                Back
              </button>
              <button
                disabled={pin.length !== 6}
                onClick={() => void submit()}
                className="grid h-14 flex-1 place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
              >
                <Send className="mr-2 h-4 w-4" /> Send
              </button>
            </div>
          </div>
        )}

        {step === "sending" && (
          <div className="mt-6 grid place-items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="mt-3 text-sm text-muted-foreground">Broadcasting on Solana…</p>
          </div>
        )}

        {step === "done" && (
          <div className="mt-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
              <Check className="h-7 w-7" />
            </div>
            <p className="mt-3 font-display text-lg font-bold">Transfer sent</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {amount} {asset.symbol} → {shortenAddress(to, 4, 4)}
            </p>
            {hash && (
              <a
                href={`https://solscan.io/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-gold hover:underline"
              >
                View on Solscan <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button
              onClick={onSent}
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
