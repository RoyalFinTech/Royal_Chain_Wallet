import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Share2, Download, ArrowLeft, Wallet, Check, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "@/components/brand/Logo";
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
  { id: "solana", label: "Solana", symbol: "SOL" },
];

function Receive() {
  const [chain, setChain] = useState<ChainId>("solana");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const wallet = useStoredWallet();
  const chainMeta = CHAINS.find((item) => item.id === chain)!;
  const address = wallet?.addresses[chain].address ?? null;

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setNotice("Address copied. Confirm the blockchain network before sharing it.");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice("Clipboard access was blocked. Select the full address and copy it manually.");
    }
  };

  const shareAddress = async () => {
    if (!address) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Royal Chain Wallet · ${chainMeta.label}`,
          text: `${chainMeta.label} receive address: ${address}`,
        });
      } else {
        await navigator.clipboard.writeText(address);
        setNotice("Sharing is unavailable in this browser; the address was copied instead.");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setNotice("Could not share the address. Use Copy Address instead.");
      }
    }
  };

  const downloadQr = () => {
    const svg = document.getElementById("royal-receive-qr");
    if (!(svg instanceof SVGSVGElement)) {
      setNotice("QR image is not ready yet. Please try again.");
      return;
    }
    try {
      const copy = svg.cloneNode(true) as SVGSVGElement;
      copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const serialized = new XMLSerializer().serializeToString(copy);
      const objectUrl = URL.createObjectURL(
        new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }),
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `royal-chain-${chain}-receive.svg`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setNotice("Your QR code was downloaded as an SVG image.");
    } catch {
      setNotice("Could not save the QR image. You can still copy or share the address.");
    }
  };

  if (!wallet || !address) {
    return (
      <div className="px-5 pb-10 pt-10">
        <header className="flex items-center gap-3">
          <Link
            to="/app"
            aria-label="Back to wallet"
            className="grid h-10 w-10 place-items-center rounded-full glass"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo size={34} withText />
        </header>
        <div className="mt-10 rounded-3xl border border-border bg-card p-7 text-center">
          <Wallet className="mx-auto h-9 w-9 text-gold" />
          <h1 className="mt-4 font-display text-xl font-bold">No local wallet found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create or import a wallet before sharing a receive address. This page will not show a demo address.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link
              to="/create-wallet"
              className="grid h-12 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy"
            >
              Create wallet
            </Link>
            <Link
              to="/import-wallet"
              className="grid h-12 place-items-center rounded-xl border border-border text-sm font-semibold"
            >
              Import wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-10 pt-10">
      <header className="flex items-center gap-3">
        <Link
          to="/app"
          aria-label="Back to wallet"
          className="grid h-10 w-10 place-items-center rounded-full glass"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">Receive Crypto</h1>
          <p className="text-xs text-muted-foreground">Real address · local wallet</p>
        </div>
        <Logo size={34} />
      </header>

      <div className="no-scrollbar mt-6 -mx-5 flex gap-2 overflow-x-auto px-5">
        {CHAINS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setChain(item.id);
              setNotice(null);
            }}
            aria-pressed={item.id === chain}
            className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition ${item.id === chain ? "border-gold bg-gold/10 shadow-soft" : "border-border bg-card"}`}
          >
            <p className="text-[10px] font-medium text-muted-foreground">{item.symbol}</p>
            <p className="font-display text-sm font-bold">{item.label}</p>
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border border-border bg-card p-5 text-center shadow-elegant sm:p-6">
        <div className="mx-auto grid max-w-[272px] place-items-center rounded-[1.6rem] border border-gold/35 bg-gradient-to-br from-white via-white to-amber-50 p-4 shadow-[inset_0_0_0_5px_rgba(219,170,64,0.08)]">
          <QRCodeSVG
            id="royal-receive-qr"
            value={address}
            size={232}
            bgColor="#FFFFFF"
            fgColor="#071426"
            level="H"
            includeMargin
          />
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-navy px-3 py-1.5 text-[10px] font-semibold text-white">
            <Logo size={18} /> ROYAL CHAIN WALLET
          </div>
        </div>

        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {chainMeta.label} receive address
        </p>
        <p className="mt-2 break-all rounded-2xl border border-border bg-muted/30 p-3 text-left font-mono text-xs leading-5">
          {address}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Short display: {shortenAddress(address, 8, 8)}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => void copyAddress()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl gradient-gold py-3 text-xs font-semibold text-navy"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => void shareAddress()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-xs font-semibold"
          >
            <Share2 className="h-4 w-4 text-gold" /> Share
          </button>
          <button
            type="button"
            onClick={downloadQr}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-xs font-semibold"
          >
            <Download className="h-4 w-4 text-gold" /> Save QR
          </button>
        </div>
        {notice && (
          <p role="status" className="mt-3 text-left text-xs text-muted-foreground">
            {notice}
          </p>
        )}
      </section>

      <div className="mt-4 flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs leading-5 text-muted-foreground">
          Send only {chainMeta.label} assets to this address. Token deposits, confirmations, and balances depend on the real mint/contract and network integration being enabled.
        </p>
      </div>
    </div>
  );
}
