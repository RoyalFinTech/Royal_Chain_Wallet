import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Share2, Download, QrCode, Wallet } from "lucide-react";
import { useState } from "react";
import { DEMO_IDENTITY } from "@/lib/wallet-identity";
import { QrSkeleton } from "@/components/ui/skeletons";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";
import { useStoredWallet } from "@/hooks/use-wallet";
import { shortenAddress } from "@/lib/wallet";
import type { ChainId } from "@/lib/wallet/derive";

export const Route = createFileRoute("/app/receive")({
  component: Receive,
});

const CHAINS: { id: ChainId; label: string; symbol: string }[] = [
  { id: "bitcoin", label: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", label: "Ethereum", symbol: "ETH" },
  { id: "bnb", label: "BNB Chain", symbol: "BNB" },
  { id: "solana", label: "Solana (+ ROY, USDT, USDC)", symbol: "SOL" },
];

function Receive() {
  const [chain, setChain] = useState<ChainId>("solana");
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const generating = useSimulatedLoading(600, [chain, amount]);
  const wallet = useStoredWallet();

  const chainMeta = CHAINS.find((c) => c.id === chain)!;
  const address = wallet ? wallet.addresses[chain].address : null;
  const displayId = address ?? DEMO_IDENTITY.walletId;

  const payload = address
    ? `${chainMeta.symbol.toLowerCase()}:${address}${amount ? `?amount=${amount}` : ""}`
    : `royal:${DEMO_IDENTITY.walletId}${amount ? `&amt=${amount}` : ""}`;

  const copy = async () => {
    await navigator.clipboard.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="px-5 pt-10">
      <h1 className="font-display text-2xl font-bold">Receive Assets</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Select a network, then share your address or QR code.
      </p>

      <div className="no-scrollbar mt-5 -mx-5 flex gap-2 overflow-x-auto px-5">
        {CHAINS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChain(c.id)}
            className={`shrink-0 rounded-2xl border px-3 py-2 text-left transition ${c.id === chain ? "border-gold bg-gold/10" : "border-border bg-card"}`}
          >
            <p className="text-[10px] font-medium text-muted-foreground">{c.symbol}</p>
            <p className="font-display text-xs font-bold">{c.label.split(" (")[0]}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
        <div className="mx-auto grid h-56 w-56 place-items-center rounded-3xl bg-gradient-to-br from-navy to-black p-4">
          {generating ? (
            <QrSkeleton size={192} />
          ) : (
            <div className="grid h-full w-full animate-fade-in grid-cols-12 grid-rows-12 gap-[2px] rounded-xl bg-white p-3">
              {Array.from({ length: 144 }).map((_, i) => {
                const seed = (i * 9301 + payload.length * 49297) % 233280;
                const on = seed / 233280 > 0.5;
                return <div key={i} className={on ? "bg-navy" : "bg-white"} />;
              })}
            </div>
          )}
        </div>

        <div className="mt-4 grid h-10 w-10 mx-auto place-items-center rounded-full gradient-gold text-navy shadow-glow -mt-8 ring-4 ring-card">
          <QrCode className="h-4 w-4" />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {address ? `${chainMeta.label.split(" (")[0]} Address` : "Royal Wallet ID (demo)"}
        </p>
        <p className="mt-1 flex items-center justify-center gap-1 font-mono text-sm font-semibold">
          {address && <Wallet className="h-3.5 w-3.5 text-gold" />}
          {address ? shortenAddress(address, 8, 8) : DEMO_IDENTITY.walletId}
        </p>
        {!address && (
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            Create a wallet to receive real crypto payments
          </p>
        )}
        {chain === "solana" && address && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            This address also receives ROY, USDT, and USDC (SPL tokens).
          </p>
        )}
      </div>

      <div className="mt-4">
        <label>
          <span className="text-xs font-medium text-muted-foreground">Amount (optional)</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={copy}
          className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3 text-xs"
        >
          <Copy className="h-4 w-4 text-gold" /> {copied ? "Copied" : "Copy Address"}
        </button>
        <button className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3 text-xs">
          <Share2 className="h-4 w-4 text-gold" /> Share
        </button>
        <button className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3 text-xs">
          <Download className="h-4 w-4 text-gold" /> Save QR
        </button>
      </div>

      <Link
        to="/qr"
        className="mt-6 grid h-14 w-full place-items-center rounded-2xl border border-border bg-card font-semibold"
      >
        Scan to pay a merchant
      </Link>
    </div>
  );
}
