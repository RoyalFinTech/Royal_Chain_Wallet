import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ScanLine,
  QrCode,
  Share2,
  Zap,
  Camera,
  Flashlight,
  Image as ImageIcon,
  Keyboard,
  Check,
  Copy,
  Download,
  Fingerprint,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEMO_IDENTITY } from "@/lib/wallet-identity";
import { CURRENCIES, CURRENCY_LIST, formatCurrency, type CurrencyCode } from "@/lib/currencies";
import { Receipt } from "@/components/wallet/Receipt";
import { makeHash, makeReceiptNo, type ReceiptData } from "@/lib/receipts";
import { QrSkeleton } from "@/components/ui/skeletons";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";

export const Route = createFileRoute("/qr")({
  component: QrPage,
  head: () => ({ meta: [{ title: "QR Payments — Royal Chain Wallet" }] }),
});

type Screen = "home" | "receive" | "scan" | "merchant" | "confirm" | "success";

function QrPage() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("home");
  const [merchant, setMerchant] = useState<{
    name: string;
    id: string;
    amount: number;
    currency: CurrencyCode;
    note: string;
  } | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-14">
      <header className="flex items-center gap-3 px-5 pt-10">
        <button
          onClick={() => (screen === "home" ? navigate({ to: "/app" }) : setScreen("home"))}
          className="grid h-10 w-10 place-items-center rounded-full glass"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-xl font-bold">
          {screen === "home" && "QR Payments"}
          {screen === "receive" && "Receive Money"}
          {screen === "scan" && "Scan & Pay"}
          {screen === "merchant" && "Confirm Merchant"}
          {screen === "confirm" && "Confirm Payment"}
          {screen === "success" && "Payment Sent"}
        </h1>
      </header>

      <div className="px-5 pt-6 animate-fade-in" key={screen}>
        {screen === "home" && <QrHome onPick={setScreen} />}
        {screen === "receive" && <ReceiveScreen />}
        {screen === "scan" && (
          <ScanScreen
            onFound={(m) => {
              setMerchant(m);
              setScreen("merchant");
            }}
          />
        )}
        {screen === "merchant" && merchant && (
          <MerchantScreen
            merchant={merchant}
            onCancel={() => setScreen("scan")}
            onContinue={() => setScreen("confirm")}
          />
        )}
        {screen === "confirm" && merchant && (
          <ConfirmScreen
            merchant={merchant}
            onDone={(r) => {
              setReceipt(r);
              setScreen("success");
            }}
          />
        )}
        {screen === "success" && receipt && (
          <SuccessScreen data={receipt} onDone={() => navigate({ to: "/app" })} />
        )}
      </div>
    </div>
  );
}

/* ---------- Screen 1: QR Home ---------- */
function QrHome({ onPick }: { onPick: (s: Screen) => void }) {
  return (
    <div className="space-y-4">
      <button
        onClick={() => onPick("receive")}
        className="group relative w-full overflow-hidden rounded-3xl p-6 text-left text-white shadow-elegant gradient-royal transition hover:-translate-y-0.5"
      >
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/25 blur-3xl transition group-hover:scale-125" />
        <div className="relative">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-gold/40">
            <QrCode className="h-7 w-7 text-gold" />
          </span>
          <p className="mt-4 font-display text-xl font-bold">Receive Money</p>
          <p className="mt-1 text-sm text-white/70">
            Share your personal QR to accept payments instantly.
          </p>
        </div>
      </button>

      <button
        onClick={() => onPick("scan")}
        className="group relative w-full overflow-hidden rounded-3xl border border-border bg-card p-6 text-left shadow-soft transition hover:-translate-y-0.5"
      >
        <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl transition group-hover:scale-125" />
        <div className="relative">
          <span className="grid h-14 w-14 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
            <ScanLine className="h-7 w-7" />
          </span>
          <p className="mt-4 font-display text-xl font-bold">Scan & Pay</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pay merchants, friends or bills with a single scan.
          </p>
        </div>
      </button>

      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Tip</p>
        <p className="mt-1">
          Every scan is signed on-device. Your private keys never leave your wallet.
        </p>
      </div>
    </div>
  );
}

/* ---------- Screen 2: Receive ---------- */
function ReceiveScreen() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [copied, setCopied] = useState<"id" | "addr" | null>(null);
  const generating = useSimulatedLoading(600, [currency, amount, note, refresh]);

  const payload = JSON.stringify({
    walletId: DEMO_IDENTITY.walletId,
    address: DEMO_IDENTITY.address,
    amount: amount || undefined,
    currency,
    note: note || undefined,
    r: refresh,
  });

  const copy = async (what: "id" | "addr") => {
    const v = what === "id" ? DEMO_IDENTITY.walletId : DEMO_IDENTITY.address;
    await navigator.clipboard.writeText(v);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Pay me on Royal Chain", text: payload });
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5 text-center shadow-soft">
        <div className="flex items-center justify-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full gradient-gold font-display font-bold text-navy">
            FN
          </div>
          <div className="text-left">
            <p className="font-display text-base font-bold">Fatoumata Njie</p>
            <p className="font-mono text-[11px] text-muted-foreground">{DEMO_IDENTITY.walletId}</p>
          </div>
        </div>

        <div className="relative mx-auto mt-5 w-full max-w-xs">
          {generating ? (
            <QrSkeleton />
          ) : (
            <div className="animate-fade-in">
              <FakeQR seed={payload} />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px]">
          <span className="rounded-full bg-muted px-2 py-1 font-mono">{DEMO_IDENTITY.address}</span>
          <span className="rounded-full bg-gold/10 px-2 py-1 font-semibold text-gold ring-1 ring-gold/30">
            {CURRENCIES[currency].flag} {currency}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="text-xs font-medium text-muted-foreground">Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm"
          >
            {CURRENCY_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </label>
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
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">Payment note</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 60))}
          placeholder="What's this for?"
          className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm"
        />
      </label>

      <div className="grid grid-cols-4 gap-2">
        <ActionBtn
          icon={Copy}
          label={copied === "id" ? "Copied" : "Copy ID"}
          onClick={() => copy("id")}
        />
        <ActionBtn
          icon={Copy}
          label={copied === "addr" ? "Copied" : "Copy Addr"}
          onClick={() => copy("addr")}
        />
        <ActionBtn icon={Share2} label="Share" onClick={share} />
        <ActionBtn icon={Download} label="Save QR" onClick={() => downloadQr(payload)} />
      </div>

      <button
        onClick={() => setRefresh((r) => r + 1)}
        className="grid h-12 w-full place-items-center rounded-2xl border border-dashed border-border bg-muted/30 text-sm font-medium"
      >
        Refresh QR
      </button>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: import("lucide-react").LucideIcon;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3 text-[11px] font-medium transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <Icon className="h-4 w-4 text-gold" />
      {label}
    </button>
  );
}

function downloadQr(_payload: string) {
  // Frontend-only: renders the visible QR to canvas via html2canvas later.
  // For now, save the payload as a .txt so the wire is exercised end-to-end.
  const blob = new Blob([_payload], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "royal-qr.txt";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Screen 3: Scan & Pay ---------- */
function ScanScreen({
  onFound,
}: {
  onFound: (m: {
    name: string;
    id: string;
    amount: number;
    currency: CurrencyCode;
    note: string;
  }) => void;
}) {
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [flash, setFlash] = useState(false);
  const [manual, setManual] = useState(false);
  const [walletInput, setWalletInput] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (permission !== "granted") return;
    // Simulate scan detection after 3.5s
    timer.current = window.setTimeout(() => {
      onFound({
        name: "Kairaba SuperMart",
        id: "MID-209-887",
        amount: 2450,
        currency: "GMD",
        note: "Order #4821",
      });
    }, 3500);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [permission, onFound]);

  if (permission === "prompt") {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl gradient-gold text-navy shadow-glow">
          <Camera className="h-9 w-9" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold">Camera access required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We use your camera to scan QR codes securely. Nothing is recorded.
        </p>
        <button
          onClick={() => setPermission("granted")}
          className="mt-6 h-12 w-full rounded-2xl gradient-gold text-sm font-semibold text-navy shadow-glow"
        >
          Allow camera
        </button>
        <button
          onClick={() => setManual(true)}
          className="mt-2 h-12 w-full rounded-2xl border border-border bg-card text-sm font-medium"
        >
          Enter Wallet ID manually
        </button>
        {manual && (
          <ManualEntry
            value={walletInput}
            onChange={setWalletInput}
            onSubmit={() =>
              onFound({
                name: "Manual Recipient",
                id: walletInput || "RCW-0000-0000",
                amount: 0,
                currency: "USD",
                note: "",
              })
            }
          />
        )}
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6 text-center">
        <p className="font-display text-lg font-bold text-destructive">Camera blocked</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Enable it in your browser settings, or use manual entry.
        </p>
        <button
          onClick={() => setManual(true)}
          className="mt-4 h-12 w-full rounded-2xl border border-border bg-card text-sm font-medium"
        >
          Enter Wallet ID
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-3xl bg-navy p-4 shadow-elegant">
        <div className="relative grid h-full w-full place-items-center rounded-2xl border-2 border-dashed border-gold/60 bg-black/50">
          <ScanLine
            className={`h-16 w-16 text-gold/70 ${flash ? "drop-shadow-[0_0_18px_rgba(212,175,55,0.9)]" : ""}`}
          />
          <span
            className="absolute left-4 right-4 top-4 h-0.5 bg-gold"
            style={{ animation: "scan 2s ease-in-out infinite" }}
          />
        </div>
        {[
          "top-4 left-4 border-t-2 border-l-2",
          "top-4 right-4 border-t-2 border-r-2",
          "bottom-4 left-4 border-b-2 border-l-2",
          "bottom-4 right-4 border-b-2 border-r-2",
        ].map((c) => (
          <span key={c} className={`absolute h-6 w-6 border-gold ${c} rounded-lg`} />
        ))}
        <style>{`@keyframes scan { 0%{top:1rem} 50%{top:calc(100% - 1.25rem)} 100%{top:1rem} }`}</style>
      </div>
      <p className="text-center text-xs text-muted-foreground inline-flex w-full items-center justify-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin text-gold" /> Detecting QR code…
      </p>
      <div className="grid grid-cols-3 gap-2">
        <ActionBtn
          icon={Flashlight}
          label={flash ? "Flash on" : "Flash"}
          onClick={() => setFlash((f) => !f)}
        />
        <ActionBtn icon={ImageIcon} label="Gallery" />
        <ActionBtn icon={Keyboard} label="Manual" onClick={() => setManual(true)} />
      </div>
      {manual && (
        <ManualEntry
          value={walletInput}
          onChange={setWalletInput}
          onSubmit={() =>
            onFound({
              name: "Manual Recipient",
              id: walletInput || "RCW-0000-0000",
              amount: 0,
              currency: "USD",
              note: "",
            })
          }
        />
      )}
    </div>
  );
}

function ManualEntry({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-3">
      <label className="text-left">
        <span className="text-xs font-medium text-muted-foreground">Wallet ID</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="RCW-XXXX-XXXX"
          className="mt-1 h-12 w-full rounded-xl border border-border bg-input/40 px-3 font-mono text-sm"
        />
      </label>
      <button
        onClick={onSubmit}
        className="mt-3 h-11 w-full rounded-xl gradient-gold text-sm font-semibold text-navy shadow-glow"
      >
        Continue
      </button>
    </div>
  );
}

/* ---------- Screen 4: Merchant preview ---------- */
function MerchantScreen({
  merchant,
  onCancel,
  onContinue,
}: {
  merchant: { name: string; id: string; amount: number; currency: CurrencyCode; note: string };
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
            <Zap className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-display text-lg font-bold">{merchant.name}</p>
              <span className="grid h-4 w-4 place-items-center rounded-full bg-success/15 text-success">
                <Check className="h-2.5 w-2.5" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Verified merchant · {merchant.id}</p>
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Amount due</p>
          <p className="font-display text-4xl font-bold text-gold-shimmer">
            {formatCurrency(merchant.amount, merchant.currency)}
          </p>
          {merchant.note && <p className="mt-1 text-xs text-muted-foreground">“{merchant.note}”</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onCancel}
          className="h-12 rounded-2xl border border-border bg-card text-sm font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={onContinue}
          className="h-12 rounded-2xl gradient-gold text-sm font-semibold text-navy shadow-glow"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/* ---------- Screen 5: Confirm & authenticate ---------- */
function ConfirmScreen({
  merchant,
  onDone,
}: {
  merchant: { name: string; id: string; amount: number; currency: CurrencyCode; note: string };
  onDone: (r: ReceiptData) => void;
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const fee = Math.max(1, +(merchant.amount * 0.005).toFixed(2));

  const submit = () => {
    if (pin.length < 6) return;
    setLoading(true);
    setTimeout(() => {
      onDone({
        receiptNo: makeReceiptNo(),
        txId: `TX-${Date.now().toString(36).toUpperCase()}`,
        hash: makeHash(),
        method: "QR Payment",
        status: "completed",
        amount: -merchant.amount,
        fee,
        currency: merchant.currency,
        sender: {
          name: "Fatoumata Njie",
          walletId: DEMO_IDENTITY.walletId,
          address: DEMO_IDENTITY.address,
        },
        receiver: { name: merchant.name, walletId: merchant.id },
        date: new Date().toISOString(),
        note: merchant.note,
      });
    }, 1400);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Recipient</p>
        <p className="mt-1 font-display text-lg font-bold">{merchant.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{merchant.id}</p>

        <dl className="mt-4 space-y-2 text-sm">
          <Line k="Amount" v={formatCurrency(merchant.amount, merchant.currency)} />
          <Line k="Network fee" v={formatCurrency(fee, merchant.currency)} />
          <Line k="Total" v={formatCurrency(merchant.amount + fee, merchant.currency)} bold />
          {merchant.note && <Line k="Note" v={merchant.note} />}
        </dl>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Authenticate
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="Enter 6-digit PIN"
            className="h-12 flex-1 rounded-2xl border border-border bg-input/40 px-3 text-center font-mono tracking-[0.4em]"
          />
          <button
            className="grid h-12 w-12 place-items-center rounded-2xl gradient-gold text-navy shadow-glow"
            title="Use biometrics"
          >
            <Fingerprint className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-success" /> Encrypted end-to-end
        </p>
      </div>

      <button
        onClick={submit}
        disabled={pin.length < 6 || loading}
        className="grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          `Pay ${formatCurrency(merchant.amount + fee, merchant.currency)}`
        )}
      </button>
    </div>
  );
}

function Line({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={bold ? "font-display text-base font-bold text-gold-shimmer" : "font-medium"}>
        {v}
      </dd>
    </div>
  );
}

/* ---------- Screen 6: Success ---------- */
function SuccessScreen({ data, onDone }: { data: ReceiptData; onDone: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-success/30 bg-success/5 p-6 text-center animate-scale-in">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success text-white shadow-glow">
          <Check className="h-8 w-8" />
        </div>
        <p className="mt-3 font-display text-xl font-bold text-success">Payment Successful</p>
        <p className="mt-1 text-xs text-muted-foreground">Your funds are on their way.</p>
      </div>

      <Receipt data={data} />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.receiptNo}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="h-12 rounded-2xl border border-border bg-card text-sm font-semibold"
        >
          Download
        </button>
        <button
          onClick={async () => {
            try {
              if (navigator.share)
                await navigator.share({ title: "Royal Chain Receipt", text: data.receiptNo });
            } catch {
              /* cancelled */
            }
          }}
          className="h-12 rounded-2xl border border-border bg-card text-sm font-semibold"
        >
          Share
        </button>
      </div>
      <button
        onClick={onDone}
        className="h-14 w-full rounded-2xl gradient-gold text-sm font-semibold text-navy shadow-glow"
      >
        Done
      </button>
    </div>
  );
}

function FakeQR({ seed }: { seed: string }) {
  const size = 21;
  const cells = Array.from({ length: size * size }, (_, i) => {
    const x = i % size,
      y = Math.floor(i / size);
    const finder = (x < 3 && y < 3) || (x > size - 4 && y < 3) || (x < 3 && y > size - 4);
    const s = (x * 92821 + y * 12345 + seed.length * 7919) & 15;
    return finder || s < 7;
  });
  return (
    <div className="relative mx-auto rounded-2xl bg-white p-4">
      <div
        className="relative grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {cells.map((on, i) => (
          <span
            key={i}
            className={`aspect-square rounded-[1px] ${on ? "bg-navy" : "bg-transparent"}`}
          />
        ))}
        <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-white p-1">
          <span className="grid h-full w-full place-items-center rounded-lg gradient-gold text-navy">
            <QrCode className="h-4 w-4" />
          </span>
        </span>
      </div>
    </div>
  );
}
