import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Check,
  Trash2,
} from "lucide-react";
import { exportMnemonic } from "@/lib/wallet";
import { useStoredWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/app/export-phrase")({
  component: ExportPhrase,
});

function ExportPhrase() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const [acknowledged, setAcknowledged] = useState(false);
  const [pin, setPin] = useState(Array(6).fill(""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string[] | null>(null);
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Wipe mnemonic from memory when leaving the screen.
  useEffect(() => {
    return () => setMnemonic(null);
  }, []);

  const complete = pin.every((d) => d !== "");

  async function unlock() {
    if (!wallet || !complete) return;
    setBusy(true);
    setError(null);
    try {
      const phrase = await exportMnemonic(wallet, pin.join(""));
      setMnemonic(phrase.split(" "));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not unlock wallet.");
    } finally {
      setBusy(false);
    }
  }

  async function copyPhrase() {
    if (!mnemonic) return;
    await navigator.clipboard.writeText(mnemonic.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function wipe() {
    setMnemonic(null);
    setReveal(false);
    setPin(Array(6).fill(""));
  }

  if (!wallet) {
    return (
      <div className="px-5 pt-10">
        <h1 className="font-display text-2xl font-bold">Recovery Phrase</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No wallet is stored on this device yet.
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
          onClick={() => navigate({ to: "/app/security" })}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">Recovery Phrase</h1>
          <p className="text-xs text-muted-foreground">
            Back up the {wallet.wordCount}-word phrase for this wallet.
          </p>
        </div>
      </header>

      {!mnemonic && (
        <>
          <div className="mt-5 space-y-3 rounded-3xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4" /> Read before continuing
            </p>
            <ul className="list-disc space-y-1 pl-5 text-xs text-destructive/90">
              <li>Anyone with these words controls your wallet forever.</li>
              <li>Royal Chain support will never ask for them.</li>
              <li>Never type them on a website or send them to anyone.</li>
              <li>Store them offline — paper, metal, or a hardware safe.</li>
            </ul>
            <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-2xl bg-background/60 p-3 text-xs text-foreground">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-gold"
              />
              I understand losing or sharing these words means losing my funds with no recovery.
            </label>
          </div>

          <div className={acknowledged ? "" : "pointer-events-none opacity-40"}>
            <PinInput label="Enter your PIN to reveal" value={pin} onChange={setPin} />
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            <button
              disabled={!acknowledged || !complete || busy}
              onClick={unlock}
              className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reveal Phrase"}
            </button>
          </div>
        </>
      )}

      {mnemonic && (
        <div className="mt-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="relative">
            <div
              className={`grid grid-cols-3 gap-2 rounded-2xl border border-border bg-muted/40 p-3 transition ${
                reveal ? "" : "select-none blur-md"
              }`}
            >
              {mnemonic.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 rounded-xl bg-card px-2 py-2 text-xs"
                >
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span className="font-medium">{w}</span>
                </div>
              ))}
            </div>
            {!reveal && (
              <button
                onClick={() => setReveal(true)}
                className="absolute inset-0 grid place-items-center rounded-2xl text-xs font-semibold text-foreground"
              >
                <span className="rounded-full bg-card px-4 py-2 shadow-soft ring-1 ring-border">
                  <Eye className="mr-1 inline h-3 w-3" /> Tap to reveal
                </span>
              </button>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={copyPhrase}
              className="flex flex-1 items-center justify-center gap-1 rounded-full border border-border bg-card py-2 text-xs"
            >
              {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}{" "}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => setReveal((r) => !r)}
              className="flex flex-1 items-center justify-center gap-1 rounded-full border border-border bg-card py-2 text-xs"
            >
              {reveal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{" "}
              {reveal ? "Hide" : "Show"}
            </button>
            <button
              onClick={wipe}
              className="flex flex-1 items-center justify-center gap-1 rounded-full border border-destructive/40 bg-destructive/5 py-2 text-xs text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Wipe
            </button>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-success" /> Cleared automatically when you leave
            this screen.
          </p>
        </div>
      )}
    </div>
  );
}

function PinInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const set = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...value];
    next[i] = v;
    onChange(next);
    if (v && i < value.length - 1) document.getElementById(`export-pin-${i + 1}`)?.focus();
  };
  return (
    <div className="mt-5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-2 flex gap-2">
        {value.map((d, i) => (
          <input
            key={i}
            id={`export-pin-${i}`}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => set(i, e.target.value)}
            className="h-12 w-full rounded-2xl border border-border bg-input/40 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gold/60"
          />
        ))}
      </div>
    </div>
  );
}
