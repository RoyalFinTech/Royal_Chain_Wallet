import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, ShieldCheck, Loader2, Wallet, AlertTriangle } from "lucide-react";
import { useStoredWallet } from "@/hooks/use-wallet";
import { shortenAddress, unlockWallet } from "@/lib/wallet";
import {
  bitcoinService,
  ethereumService,
  bnbService,
  solanaService,
  transactionService,
  walletService,
  ASSET_CATALOG,
  type AssetSymbol,
  type AssetBalance,
} from "@/lib/services";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/send")({
  component: SendMoney,
});

type Step = 0 | 1 | 2 | 3 | 4;

const VALIDATORS: Record<AssetSymbol, (a: string) => boolean> = {
  BTC: bitcoinService.isValidAddress,
  ETH: ethereumService.isValidAddress,
  BNB: bnbService.isValidAddress,
  SOL: solanaService.isValidAddress,
  ROY: solanaService.isValidAddress,
  USDT: solanaService.isValidAddress,
  USDC: solanaService.isValidAddress,
};

function SendMoney() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const portfolio = useQuery({
    queryKey: ["portfolio", wallet?.addresses.solana.address],
    enabled: !!wallet,
    queryFn: () => walletService.getPortfolio(wallet!.addresses),
  });

  const [step, setStep] = useState<Step>(0);
  const [asset, setAsset] = useState<AssetBalance | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const symbol = asset?.symbol ?? "SOL";
  const meta = ASSET_CATALOG[symbol];
  const balance = asset?.amount ?? 0;
  const fee =
    meta.chain === "bitcoin"
      ? 0.0001
      : meta.chain === "ethereum"
        ? 0.002
        : meta.chain === "bnb"
          ? 0.0005
          : 0.000005;
  const total = (Number(amount) || 0) + (asset ? fee : 0);

  const back = () => (step === 0 ? navigate({ to: "/app" }) : setStep((s) => (s - 1) as Step));

  const validateAddress = (a: string) => VALIDATORS[symbol](a);
  const addressOk = recipient.trim().length > 0 && validateAddress(recipient.trim());
  const amountOk = Number(amount) > 0 && Number(amount) <= balance;
  const pinOk = /^\d{6}$/.test(pin);

  async function broadcast() {
    if (!wallet || !asset) {
      setError("No wallet loaded.");
      return;
    }
    setError(null);
    setBroadcasting(true);
    try {
      const { mnemonic } = await unlockWallet(wallet, pin); // verifies PIN, decrypts locally — never leaves device
      const record = await transactionService.submitTransfer({
        fromAddress: walletService.addressForSymbol(wallet.addresses, symbol),
        toAddress: recipient.trim(),
        symbol,
        chain: meta.chain,
        amount: Number(amount),
        usdValue: Number(amount) * asset.usdPrice,
        mnemonic, // enables a real signed broadcast when this chain has a live RPC endpoint configured
      });
      setTxHash(record.hash);
      setStep(4);
      toast.success(`Sent ${amount} ${symbol}`, {
        description: `To ${shortenAddress(recipient, 6, 6)}`,
      });
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Broadcast failed. Please try again.";
      setError(message);
      toast.error("Transfer failed", { description: message });
    } finally {
      setBroadcasting(false);
    }
  }

  if (!wallet) return <NoWalletState onBack={() => navigate({ to: "/app" })} />;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-14">
      <header className="flex items-center gap-3 px-5 pt-10">
        <button onClick={back} className="grid h-10 w-10 place-items-center rounded-full glass">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold">Send {asset ? symbol : "Crypto"}</h1>
          <p className="truncate text-[11px] text-muted-foreground font-mono">
            From {shortenAddress(walletService.addressForSymbol(wallet.addresses, symbol), 6, 6)}
          </p>
        </div>
        {asset && (
          <div className="ml-auto text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Balance</p>
            <p className="font-display text-sm font-bold text-gold-shimmer">
              {balance} {symbol}
            </p>
          </div>
        )}
      </header>

      <div className="mt-4 flex gap-1 px-5">
        {[0, 1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full ${n <= step ? "gradient-gold" : "bg-muted"}`}
          />
        ))}
      </div>

      <div className="px-5 pt-6">
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <label className="text-xs font-medium text-muted-foreground">Choose an asset</label>
            <div className="mt-2 space-y-2">
              {portfolio.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading balances…</p>
              ) : (
                (portfolio.data?.assets ?? []).map((a) => {
                  const m = ASSET_CATALOG[a.symbol];
                  return (
                    <button
                      key={a.symbol}
                      onClick={() => {
                        setAsset(a);
                        setStep(1);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition hover:shadow-soft"
                    >
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${m.iconGradient} text-white text-[10px] font-bold`}
                      >
                        {a.symbol.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {a.amount} {a.symbol}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ${a.usdValue.toLocaleString()}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {step === 1 && asset && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <label className="text-xs font-medium text-muted-foreground">
              Recipient {meta.name} address
            </label>
            <textarea
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              rows={3}
              spellCheck={false}
              placeholder={`Enter a ${meta.name} address`}
              className="mt-1 w-full resize-none rounded-2xl border border-border bg-input/40 px-4 py-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold/60"
            />
            {recipient && !addressOk && (
              <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" /> Invalid {meta.name} address
              </p>
            )}
            <button
              disabled={!addressOk}
              onClick={() => setStep(2)}
              className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && asset && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <p className="text-sm text-muted-foreground">Sending to</p>
            <p className="font-mono text-xs">{shortenAddress(recipient, 10, 10)}</p>

            <div className="mt-8 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Amount ({symbol})
              </p>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0.00"
                className="mt-2 w-full bg-transparent text-center font-display text-5xl font-bold outline-none placeholder:text-muted-foreground/40"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Available: {balance} {symbol}
              </p>
            </div>

            <input
              placeholder="Message / comment (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 120))}
              className="mt-6 h-12 w-full rounded-2xl border border-border bg-input/40 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            />

            {!amountOk && amount && (
              <p className="mt-2 text-xs text-destructive">
                {Number(amount) > balance ? "Insufficient balance" : "Enter a valid amount"}
              </p>
            )}

            <button
              disabled={!amountOk}
              onClick={() => setStep(3)}
              className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
            >
              Review
            </button>
          </div>
        )}

        {step === 3 && asset && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="rounded-3xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                You're sending
              </p>
              <p className="mt-1 font-display text-4xl font-bold text-gold-shimmer">
                {amount} {symbol}
              </p>
              <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                <Line
                  label="From"
                  value={shortenAddress(
                    walletService.addressForSymbol(wallet.addresses, symbol),
                    6,
                    6,
                  )}
                />
                <Line label="To" value={shortenAddress(recipient, 6, 6)} />
                {note && <Line label="Comment" value={note} />}
                <Line label="Est. network fee" value={`~${fee} ${symbol}`} />
                <Line label="Total" value={`${total.toFixed(6)} ${symbol}`} bold />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-xs text-success">
                <ShieldCheck className="h-4 w-4" /> Signed locally on your device
              </div>
            </div>

            <label className="mt-4 block text-xs font-medium text-muted-foreground">
              Enter your 6-digit PIN
            </label>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-14 w-full rounded-2xl border border-border bg-input/40 text-center font-display text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-gold/60"
              placeholder="••••••"
            />
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

            <button
              disabled={!pinOk || broadcasting}
              onClick={broadcast}
              className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
            >
              {broadcasting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm & Broadcast"}
            </button>
          </div>
        )}

        {step === 4 && asset && (
          <div className="pt-6 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full gradient-gold text-navy shadow-glow">
              <Check className="h-10 w-10" strokeWidth={3} />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold">Transaction Broadcast</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your {symbol} is on its way. Confirmation typically takes ~10-30 seconds.
            </p>

            <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-5 text-left">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Transaction</p>
              <p className="mt-1 break-all font-mono text-[11px]">{txHash}</p>
              <div className="mt-4 space-y-2 text-sm">
                <Line label="Amount" value={`${amount} ${symbol}`} bold />
                <Line label="To" value={shortenAddress(recipient, 6, 6)} />
                <Line label="Fee (est)" value={`~${fee} ${symbol}`} />
                <Line label="Date" value={new Date().toLocaleString()} />
              </div>
            </div>

            <Link
              to="/app"
              className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function NoWalletState({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-background px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
        <Wallet className="h-7 w-7" />
      </div>
      <h1 className="mt-4 font-display text-xl font-bold">No wallet yet</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Create or import a Royal Chain Wallet before sending funds.
      </p>
      <div className="mt-6 flex gap-2">
        <Link
          to="/create-wallet"
          className="grid h-12 min-w-32 place-items-center rounded-2xl gradient-gold px-4 text-sm font-semibold text-navy shadow-glow"
        >
          Create Wallet
        </Link>
        <Link
          to="/import-wallet"
          className="grid h-12 min-w-32 place-items-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold"
        >
          Import
        </Link>
      </div>
      <button onClick={onBack} className="mt-4 text-xs text-muted-foreground hover:underline">
        Back
      </button>
    </div>
  );
}

function Line({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          bold
            ? "font-display text-base font-bold text-right break-all"
            : "font-medium text-right break-all"
        }
      >
        {value}
      </span>
    </div>
  );
}
