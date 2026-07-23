import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ImageIcon, RefreshCw, Send, Loader2, X, Check } from "lucide-react";
import { useStoredWallet } from "@/hooks/use-wallet";
import { unlockWallet, shortenAddress, type StoredWallet } from "@/lib/wallet";

export const Route = createFileRoute("/app/nfts")({
  component: NftsPage,
});

interface NftItem {
  address: string;
  name: string;
  collection: string;
  gradient: string;
}

const COLLECTIONS = ["Royal Crest", "Gambia Genesis", "FinTech Founders", "Royal Play Pass"];
const GRADIENTS = [
  "from-amber-400 to-orange-600",
  "from-fuchsia-400 to-purple-600",
  "from-emerald-400 to-teal-600",
  "from-blue-400 to-indigo-600",
];

/** Deterministic mock NFT collection for the wallet's Solana address. */
function mockNfts(address: string): NftItem[] {
  let h = 0;
  for (let i = 0; i < address.length; i++) h = (h * 31 + address.charCodeAt(i)) >>> 0;
  const count = h % 5; // 0-4 items, so "empty state" is reachable too
  return Array.from({ length: count }, (_, i) => ({
    address: `${address.slice(0, 6)}nft${i}`,
    name: `${COLLECTIONS[(h + i) % COLLECTIONS.length]} #${(h >> (i + 2)) % 999}`,
    collection: COLLECTIONS[(h + i) % COLLECTIONS.length],
    gradient: GRADIENTS[(h + i) % GRADIENTS.length],
  }));
}

function NftsPage() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const [refreshTick, setRefreshTick] = useState(0);
  const [selected, setSelected] = useState<NftItem | null>(null);

  const items = useMemo(
    () => (wallet ? mockNfts(wallet.addresses.solana.address) : []),
    [wallet, refreshTick],
  );

  if (!wallet) {
    return (
      <div className="px-5 pt-10">
        <h1 className="font-display text-2xl font-bold">Collectibles</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create a wallet to view your NFTs.</p>
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
          <h1 className="font-display text-2xl font-bold">Collectibles</h1>
          <p className="text-xs text-muted-foreground">NFTs on Solana</p>
        </div>
        <button
          onClick={() => setRefreshTick((t) => t + 1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </header>

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-gold">
            <ImageIcon className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-semibold">No NFTs yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Received collectibles will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map((nft) => (
            <button
              key={nft.address}
              onClick={() => setSelected(nft)}
              className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:shadow-soft"
            >
              <div
                className={`aspect-square bg-gradient-to-br ${nft.gradient} grid place-items-center`}
              >
                <ImageIcon className="h-8 w-8 text-white/70" />
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-semibold">{nft.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {nft.collection}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <NftSendSheet
          nft={selected}
          wallet={wallet}
          onClose={() => setSelected(null)}
          onSent={() => {
            setSelected(null);
            setRefreshTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function NftSendSheet({
  nft,
  wallet,
  onClose,
  onSent,
}: {
  nft: NftItem;
  wallet: StoredWallet;
  onClose: () => void;
  onSent: () => void;
}) {
  const [to, setTo] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"form" | "pin" | "sending" | "done">("form");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setStep("sending");
    try {
      await unlockWallet(wallet, pin); // verifies PIN, decrypts locally — never leaves device
      await new Promise((r) => setTimeout(r, 900));
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfer failed.");
      setStep("pin");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid items-end bg-black/60 motion-backdrop-in"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl border-t border-border bg-card p-5 motion-sheet-in sm:mx-auto sm:mb-auto sm:mt-16 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br ${nft.gradient}`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{nft.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{nft.collection}</p>
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
                New owner (Solana address)
              </span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Solana address"
                className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-4 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold/60"
              />
            </label>
            <p className="text-[11px] text-muted-foreground">
              Transferring an NFT is irreversible. Network fee ~0.0005 SOL.
            </p>
            <button
              disabled={to.trim().length === 0}
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
                <Send className="mr-2 h-4 w-4" /> Transfer
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
            <p className="mt-3 font-display text-lg font-bold">NFT sent</p>
            <p className="mt-1 text-xs text-muted-foreground">
              New owner: {shortenAddress(to, 4, 4)}
            </p>
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
