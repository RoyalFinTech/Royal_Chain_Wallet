import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, Loader2, ShieldCheck, Check } from "lucide-react";
import { changePin } from "@/lib/wallet";
import { useStoredWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/app/change-pin")({
  component: ChangePin,
});

function ChangePin() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const [oldPin, setOldPin] = useState(Array(6).fill(""));
  const [newPin, setNewPin] = useState(Array(6).fill(""));
  const [confirmPin, setConfirmPin] = useState(Array(6).fill(""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const complete = (arr: string[]) => arr.every((d) => d !== "");
  const newMatches = newPin.join("") === confirmPin.join("");
  const canSubmit =
    complete(oldPin) &&
    complete(newPin) &&
    complete(confirmPin) &&
    newMatches &&
    newPin.join("") !== oldPin.join("");

  async function submit() {
    if (!wallet || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await changePin(wallet, oldPin.join(""), newPin.join(""));
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change PIN.");
    } finally {
      setBusy(false);
    }
  }

  if (!wallet) {
    return (
      <div className="px-5 pt-10">
        <h1 className="font-display text-2xl font-bold">Change PIN</h1>
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

  if (done) {
    return (
      <div className="px-5 pt-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">PIN Updated</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your new PIN protects this wallet.</p>
        <button
          onClick={() => navigate({ to: "/app/security" })}
          className="mt-8 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow"
        >
          Back to Security
        </button>
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
          <h1 className="font-display text-2xl font-bold">Change PIN</h1>
          <p className="text-xs text-muted-foreground">Re-authenticate with your current PIN.</p>
        </div>
      </header>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-gold/30 bg-gold/5 p-3 text-xs text-foreground">
        <Lock className="h-4 w-4 text-gold" />
        Your recovery phrase stays the same. Only the PIN that unlocks it changes.
      </div>

      <PinInput label="Current PIN" value={oldPin} onChange={setOldPin} idPrefix="old" />
      <PinInput label="New PIN" value={newPin} onChange={setNewPin} idPrefix="new" />
      <PinInput
        label="Confirm new PIN"
        value={confirmPin}
        onChange={setConfirmPin}
        idPrefix="conf"
      />

      {complete(confirmPin) && !newMatches && (
        <p className="mt-2 text-xs text-destructive">New PINs don't match.</p>
      )}
      {complete(newPin) && newPin.join("") === oldPin.join("") && complete(oldPin) && (
        <p className="mt-2 text-xs text-destructive">
          Choose a PIN different from your current one.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <button
        disabled={!canSubmit || busy}
        onClick={submit}
        className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update PIN"}
      </button>

      <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3 text-success" /> Encrypted locally with AES-GCM.
      </p>
    </div>
  );
}

function PinInput({
  label,
  value,
  onChange,
  idPrefix,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  idPrefix: string;
}) {
  const set = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...value];
    next[i] = v;
    onChange(next);
    if (v && i < value.length - 1) document.getElementById(`${idPrefix}-${i + 1}`)?.focus();
  };
  return (
    <div className="mt-5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-2 flex gap-2">
        {value.map((d, i) => (
          <input
            key={i}
            id={`${idPrefix}-${i}`}
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
