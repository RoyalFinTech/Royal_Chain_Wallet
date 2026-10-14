import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, ArrowRight, Camera, Copy, QrCode, ScanLine, Share2, ShieldAlert, Wallet, Download } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useStoredWallet } from "@/hooks/use-wallet";
import type { ChainId, StoredWallet } from "@/lib/wallet";
import { shortenAddress } from "@/lib/wallet";

export const Route = createFileRoute("/qr")({
  component: QrPage,
  head: () => ({ meta: [{ title: "QR & Address Tools — Royal Chain Wallet" }] }),
});

type Screen = "home" | "receive" | "scan";

function QrPage() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-14">
      <header className="flex items-center gap-3 px-5 pt-10">
        <button
          type="button"
          onClick={() => screen === "home" ? navigate({ to: "/app" }) : setScreen("home")}
          className="grid h-10 w-10 place-items-center rounded-full glass"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold">
            {screen === "home" ? "QR & Address Tools" : screen === "receive" ? "Receive Address" : "Scan & Connect"}
          </h1>
          <p className="text-[11px] text-muted-foreground">Royal Chain Wallet</p>
        </div>
        <Logo size={34} />
      </header>
      <main className="px-5 pt-6">
        {screen === "home" && <QrHome onPick={setScreen} />}
        {screen === "receive" && <ReceiveScreen wallet={wallet} />}
        {screen === "scan" && <ScanScreen />}
      </main>
    </div>
  );
}

function QrHome({ onPick }: { onPick: (screen: Screen) => void }) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => onPick("receive")}
        className="group relative w-full overflow-hidden rounded-3xl p-6 text-left text-white shadow-elegant gradient-royal transition hover:-translate-y-0.5"
      >
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
        <div className="relative">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-gold/40">
            <Wallet className="h-7 w-7 text-gold" />
          </span>
          <p className="mt-4 font-display text-xl font-bold">Receive Crypto</p>
          <p className="mt-1 text-sm text-white/70">Generate a real QR code from your wallet address.</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onPick("scan")}
        className="group relative w-full overflow-hidden rounded-3xl border border-border bg-card p-6 text-left shadow-soft transition hover:-translate-y-0.5"
      >
        <div className="relative">
          <span className="grid h-14 w-14 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
            <ScanLine className="h-7 w-7" />
          </span>
          <p className="mt-4 font-display text-xl font-bold">Scan a dApp QR</p>
          <p className="mt-1 text-sm text-muted-foreground">Open WalletConnect's scanner to pair with a dApp.</p>
        </div>
      </button>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <ShieldAlert className="h-4 w-4 text-amber-600" /> QR scanning does not send funds
        </p>
        <p className="mt-1">
          A receive QR only encodes an address. Merchant checkout, token transfers, and on-chain payment confirmation are separate integrations and are not claimed to be live here.
        </p>
      </div>
    </div>
  );
}

function ReceiveScreen({ wallet }: { wallet: StoredWallet | null }) {
  const [chain, setChain] = useState<ChainId>("solana");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!wallet) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-center">
        <Wallet className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-3 font-display text-lg font-bold">No local wallet found</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create or import a wallet before sharing an address.</p>
        <div className="mt-5 flex gap-2">
          <Link to="/create-wallet" className="grid h-11 flex-1 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy">Create wallet</Link>
          <Link to="/import-wallet" className="grid h-11 flex-1 place-items-center rounded-xl border border-border text-sm font-semibold">Import wallet</Link>
        </div>
      </div>
    );
  }

  const address = wallet.addresses[chain].address;
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setNotice("Address copied. Verify the blockchain network before sending funds.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setNotice("Clipboard access was blocked. Select and copy the address manually.");
    }
  };

  const shareAddress = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Royal Chain Wallet receive address", text: `${chain.toUpperCase()} receive address: ${address}` });
      else {
        await navigator.clipboard.writeText(address);
        setNotice("Sharing is unavailable here; the address was copied instead.");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setNotice("Could not share this address.");
    }
  };

  const downloadQr = () => {
    const svg = document.getElementById("royal-qr-tool");
    if (!(svg instanceof SVGSVGElement)) {
      setNotice("QR code is not ready yet.");
      return;
    }
    const serialized = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `royal-chain-${chain}-receive.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice("QR code downloaded as an SVG image.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-gold text-navy">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-base font-bold">Your receive QR</p>
            <p className="text-xs text-muted-foreground">Encodes the real address from your local wallet</p>
          </div>
        </div>

        <label className="mt-5 block text-xs font-medium text-muted-foreground">
          Blockchain network
          <select
            value={chain}
            onChange={(e) => { setChain(e.target.value as ChainId); setNotice(null); }}
            className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm"
          >
            <option value="bitcoin">Bitcoin</option>
            <option value="ethereum">Ethereum</option>
            <option value="bnb">BNB Chain</option>
            <option value="solana">Solana</option>
          </select>
        </label>

        <div className="mx-auto mt-5 grid max-w-[272px] place-items-center rounded-3xl border border-gold/30 bg-gradient-to-br from-white to-amber-50 p-4 shadow-soft">
          <QRCodeSVG id="royal-qr-tool" value={address} size={224} bgColor="#FFFFFF" fgColor="#071426" level="H" includeMargin />
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-navy px-3 py-1.5 text-[10px] font-semibold text-white">
            <Logo size={18} /> ROYAL CHAIN WALLET
          </div>
        </div>

        <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">{chain} address</p>
        <p className="mt-2 break-all rounded-2xl border border-border bg-muted/40 p-3 font-mono text-xs">{address}</p>
        <p className="mt-2 text-[11px] text-muted-foreground">Short display: {shortenAddress(address, 7, 7)}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button type="button" onClick={() => void copyAddress()} className="flex h-11 items-center justify-center gap-2 rounded-xl gradient-gold text-xs font-semibold text-navy">
            <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" onClick={() => void shareAddress()} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-xs font-semibold">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button type="button" onClick={downloadQr} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-xs font-semibold">
            <Download className="h-4 w-4" /> Save QR
          </button>
        </div>
        {notice && <p role="status" className="mt-3 text-xs text-muted-foreground">{notice}</p>}
      </div>
    </div>
  );
}

function ScanScreen() {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
        <Camera className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-xl font-bold">Scan a WalletConnect QR</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The WalletConnect scanner reads the dApp's pairing URI. You must still review and approve the session; detecting a QR never means a payment was sent.
      </p>
      <Link to="/app/walletconnect" className="mt-5 grid h-12 w-full place-items-center gap-2 rounded-xl gradient-gold text-sm font-semibold text-navy">
        Open WalletConnect <ArrowRight className="ml-1 inline h-4 w-4" />
      </Link>
    </div>
  );
}
