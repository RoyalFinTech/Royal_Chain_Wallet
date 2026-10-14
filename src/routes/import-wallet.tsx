import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileArchive,
  KeyRound,
  Loader2,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NetworkGrid } from "@/components/brand/FxEffects";
import { RecoveryPhraseInput, isKnownWord } from "@/components/wallet/RecoveryPhraseInput";
import { SecurityWarning } from "@/components/wallet/SecurityWarning";
import { WalletSuccessCard } from "@/components/wallet/WalletSuccessCard";
import { COUNTRIES } from "@/lib/mock-data";
import { CURRENCY_LIST, type CurrencyCode } from "@/lib/currencies";
import type { RoyalWalletIdentity } from "@/lib/wallet-identity";

export const Route = createFileRoute("/import-wallet")({
  component: ImportWallet,
});

type Method = "phrase" | "backup" | "key";
type Step = "choose" | "input" | "restoring" | "security" | "success" | "profile" | "done";

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

function ImportWallet() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<Method>("phrase");

  // Phrase state
  const [phraseLength, setPhraseLength] = useState<12 | 24>(12);
  const [words, setWords] = useState<string[]>(Array(24).fill(""));

  // Backup state
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupPass, setBackupPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Private key state
  const [privateKey, setPrivateKey] = useState("");
  const [ackRisk, setAckRisk] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<RoyalWalletIdentity | null>(null);

  // Session timeout — reset flow if idle too long while handling secrets.
  useEffect(() => {
    if (step === "done" || step === "choose") return;
    const t = window.setTimeout(() => {
      setWords(Array(24).fill(""));
      setBackupPass("");
      setPrivateKey("");
      setPin("");
      setConfirmPin("");
      setIdentity(null);
      setStep("choose");
      setError("Session timed out for your security. Please start again.");
    }, SESSION_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [step]);

  // Warn user about screenshots (best-effort — cannot truly block).
  useEffect(() => {
    if (step === "input" && method === "phrase") {
      // no-op: warning banner is rendered in UI.
    }
  }, [step, method]);

  const startImport = (m: Method) => {
    if (m !== "phrase") {
      setError("This import method is not available yet. Restore using a valid BIP-39 recovery phrase.");
      return;
    }
    setMethod(m);
    setError(null);
    setStep("input");
  };

  const canRestore = (() => {
    if (method === "phrase") {
      const active = words.slice(0, phraseLength);
      // Real BIP-39 mnemonic validation happens in runRestore; here we just
      // require every slot to have a word.
      return active.every((w) => w.trim() !== "");
    }
    // Backup/private-key restoration is intentionally disabled until real,
    // verifiable parsers are implemented. Never simulate a successful import.
    return false;
  })();

  const runRestore = async () => {
    setError(null);
    setStep("restoring");

    if (method !== "phrase") {
      setError("This import method is not available yet. No wallet was restored.");
      setStep("input");
      return;
    }

    try {
      const phrase = words.slice(0, phraseLength).join(" ");
      const { validateMnemonic } = await import("@/lib/wallet");
      if (!validateMnemonic(phrase)) {
        throw new Error("Recovery phrase is invalid. Check the word list and checksum.");
      }
      const { deriveAllChains } = await import("@/lib/wallet/derive");
      const addresses = await deriveAllChains(phrase);
      const addr = addresses.solana.address;
      // Keep only public preview data until the user chooses a personal PIN.
      setIdentity({
        walletId: `RCW-${addr.slice(-8, -4).toUpperCase()}-${addr.slice(-4).toUpperCase()}`,
        address: addr,
        recoveryPhrase: [],
        createdAt: new Date().toISOString(),
      });
      setPin("");
      setConfirmPin("");
      setStep("security");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not validate recovery phrase.");
      setStep("input");
    }
  };

  const pinOk = /^\d{6}$/.test(pin) && pin === confirmPin;

  async function securePhraseRestore() {
    if (method !== "phrase" || !pinOk) return;
    setError(null);
    setStep("restoring");
    try {
      const { importWallet } = await import("@/lib/wallet");
      const stored = await importWallet(words.slice(0, phraseLength).join(" "), pin);
      const addr = stored.addresses.solana.address;
      setIdentity({
        walletId: `RCW-${addr.slice(-8, -4).toUpperCase()}-${addr.slice(-4).toUpperCase()}`,
        address: addr,
        // Do not retain the recovery phrase in the success-screen component.
        recoveryPhrase: [],
        createdAt: stored.createdAt,
      });
      setWords(Array(24).fill(""));
      setPin("");
      setConfirmPin("");
      setBackupPass("");
      setPrivateKey("");
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not secure restored wallet.");
      setStep("security");
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col bg-background">
      <div className="relative overflow-hidden gradient-royal pb-20 pt-8 text-white">
        <NetworkGrid />
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
        <header className="relative mx-auto flex w-full max-w-md items-center justify-between px-6">
          <button
            onClick={() =>
              step === "choose" ? navigate({ to: "/onboarding" }) : setStep("choose")
            }
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Logo size={36} />
          <span className="w-10" />
        </header>
        <div className="relative mx-auto mt-4 max-w-md px-6 text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-gold ring-1 ring-gold/40">
            <ShieldCheck className="h-3 w-3" /> Local & encrypted
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold">Import Your Existing Wallet</h1>
          <p className="mt-1 text-sm text-white/70">
            Restore your Royal Chain Wallet securely using your recovery phrase or wallet backup.
          </p>
        </div>
      </div>

      <section className="relative mx-auto -mt-12 w-full max-w-md flex-1 px-4 pb-10">
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-elegant">
          {step === "choose" && <ChooseMethod onPick={startImport} error={error} />}

          {step === "input" && method === "phrase" && (
            <PhrasePanel
              words={words}
              setWords={setWords}
              length={phraseLength}
              setLength={setPhraseLength}
              onRestore={runRestore}
              canRestore={canRestore}
            />
          )}

          {step === "input" && method === "backup" && (
            <BackupPanel
              file={backupFile}
              setFile={setBackupFile}
              password={backupPass}
              setPassword={setBackupPass}
              show={showPass}
              setShow={setShowPass}
              onRestore={runRestore}
              canRestore={canRestore}
              error={error}
            />
          )}

          {step === "input" && method === "key" && (
            <KeyPanel
              privateKey={privateKey}
              setPrivateKey={setPrivateKey}
              ack={ackRisk}
              setAck={setAckRisk}
              onRestore={runRestore}
              canRestore={canRestore}
            />
          )}

          {step === "restoring" && <Restoring method={method} />}

          {step === "security" && identity && (
            <PinSetupPanel
              address={identity.address}
              pin={pin}
              setPin={setPin}
              confirmPin={confirmPin}
              setConfirmPin={setConfirmPin}
              pinOk={pinOk}
              error={error}
              onContinue={() => void securePhraseRestore()}
            />
          )}

          {step === "success" && identity && (
            <SuccessPanel identity={identity} onContinue={() => setStep("profile")} />
          )}

          {step === "profile" && identity && (
            <ProfilePanel
              onFinish={() => {
                setStep("done");
                navigate({ to: "/app" });
              }}
            />
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Protected by Royal FinTech Secure Layer™ · Keys never leave your device
        </p>
      </section>
    </main>
  );
}

/* -------------------- Sub-panels -------------------- */

function ChooseMethod({ onPick, error }: { onPick: (m: Method) => void; error: string | null }) {
  const options: {
    id: Method;
    icon: typeof KeyRound;
    emoji: string;
    title: string;
    desc: string;
    tag?: string;
    disabled?: boolean;
  }[] = [
    {
      id: "phrase",
      icon: KeyRound,
      emoji: "🔐",
      title: "Recovery Phrase",
      desc: "Restore with your 12 or 24-word phrase.",
    },
    {
      id: "backup",
      icon: FileArchive,
      emoji: "📁",
      title: "Encrypted Wallet Backup",
      desc: "Not available yet — this version does not restore backup files.",
      tag: "Coming soon",
      disabled: true,
    },
    {
      id: "key",
      icon: ScanLine,
      emoji: "🔑",
      title: "Private Key Import",
      desc: "Not available yet — this version does not import private keys.",
      tag: "Coming soon",
      disabled: true,
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      {error && (
        <div className="mb-4">
          <SecurityWarning title={error} />
        </div>
      )}
      <div className="space-y-2.5">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onPick(o.id)}
            disabled={o.disabled}
            className={`group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition ${o.disabled ? "cursor-not-allowed opacity-60" : "hover:border-gold/50 hover:shadow-soft"}`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/10 text-xl">
              {o.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold">
                {o.title}
                {o.tag && (
                  <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                    {o.tag}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{o.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-gold" />
          </button>
        ))}
      </div>

      <div className="mt-5">
        <SecurityWarning variant="safe" title="Your keys never leave this device.">
          Restoration happens locally. Royal Chain Wallet never receives your phrase or private key.
        </SecurityWarning>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Don't have a wallet yet?{" "}
        <Link to="/create-wallet" className="font-semibold text-gold hover:underline">
          Create New Wallet
        </Link>
      </p>
    </div>
  );
}

function PhrasePanel({
  words,
  setWords,
  length,
  setLength,
  onRestore,
  canRestore,
}: {
  words: string[];
  setWords: (w: string[]) => void;
  length: 12 | 24;
  setLength: (n: 12 | 24) => void;
  onRestore: () => void;
  canRestore: boolean;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
        <KeyRound className="h-5 w-5" />
      </div>
      <h2 className="mt-3 font-display text-xl font-bold">Enter Recovery Phrase</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your 12 or 24-word recovery phrase to restore your wallet.
      </p>

      <div className="mt-4 inline-flex rounded-full border border-border bg-muted/40 p-1 text-xs font-medium">
        {[12, 24].map((n) => (
          <button
            key={n}
            onClick={() => setLength(n as 12 | 24)}
            className={`rounded-full px-3 py-1.5 transition ${
              length === n ? "gradient-gold text-navy shadow-soft" : "text-muted-foreground"
            }`}
          >
            {n} words
          </button>
        ))}
      </div>

      <div className="mt-4">
        <RecoveryPhraseInput words={words} onChange={setWords} length={length} />
      </div>

      <div className="mt-4 space-y-2">
        <SecurityWarning title="Never share your recovery phrase.">
          Royal Chain Wallet support will never ask for it. Avoid screenshots.
        </SecurityWarning>
      </div>

      <button
        onClick={onRestore}
        disabled={!canRestore}
        className="mt-5 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
      >
        Restore Wallet
      </button>
    </div>
  );
}

function BackupPanel({
  file,
  setFile,
  password,
  setPassword,
  show,
  setShow,
  onRestore,
  canRestore,
  error,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  password: string;
  setPassword: (s: string) => void;
  show: boolean;
  setShow: (b: boolean) => void;
  onRestore: () => void;
  canRestore: boolean;
  error: string | null;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
        <FileArchive className="h-5 w-5" />
      </div>
      <h2 className="mt-3 font-display text-xl font-bold">Upload Encrypted Backup</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Supported formats: .wallet · .json · .backup
      </p>

      <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center transition hover:border-gold/50">
        <Upload className="h-6 w-6 text-gold" />
        <p className="text-sm font-medium">{file ? file.name : "Tap to choose your backup file"}</p>
        <p className="text-[11px] text-muted-foreground">Encrypted locally — never uploaded</p>
        <input
          type="file"
          accept=".wallet,.json,.backup"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="mt-4">
        <label className="text-xs font-medium text-muted-foreground">Backup password</label>
        <div className="mt-1 flex overflow-hidden rounded-2xl border border-border bg-input/40 focus-within:ring-2 focus-within:ring-gold/60">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter backup password"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="grid w-12 place-items-center text-muted-foreground"
            aria-label="Toggle password visibility"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3">
          <SecurityWarning title={error} />
        </div>
      )}

      <button
        onClick={onRestore}
        disabled={!canRestore}
        className="mt-5 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
      >
        Decrypt & Restore Wallet
      </button>
    </div>
  );
}

function KeyPanel({
  privateKey,
  setPrivateKey,
  ack,
  setAck,
  onRestore,
  canRestore,
}: {
  privateKey: string;
  setPrivateKey: (s: string) => void;
  ack: boolean;
  setAck: (b: boolean) => void;
  onRestore: () => void;
  canRestore: boolean;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
        <ScanLine className="h-5 w-5" />
      </div>
      <h2 className="mt-3 font-display text-xl font-bold">Private Key Import</h2>
      <p className="mt-1 text-sm text-muted-foreground">Advanced users only.</p>

      <div className="mt-4">
        <SecurityWarning title="Private key import is for advanced users only.">
          Anyone with this key controls your funds. Import it only on a device you fully trust.
        </SecurityWarning>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-muted-foreground">Private key</label>
        <textarea
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value.trim())}
          rows={3}
          spellCheck={false}
          autoComplete="off"
          className="mt-1 w-full resize-none rounded-2xl border border-border bg-input/40 px-4 py-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold/60"
          placeholder="0x…"
        />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-xs">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-gold"
        />
        <span className="text-muted-foreground">
          I understand the security risks and take full responsibility for storing this key safely.
        </span>
      </label>

      <button
        onClick={onRestore}
        disabled={!canRestore}
        className="mt-5 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
      >
        Import Wallet
      </button>
    </div>
  );
}

function Restoring({ method }: { method: Method }) {
  const label =
    method === "phrase"
      ? "Verifying recovery phrase…"
      : method === "backup"
        ? "Decrypting backup file…"
        : "Deriving wallet from key…";
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in duration-500">
      <div className="relative grid h-24 w-24 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-gold/20" />
        <span
          className="absolute inset-2 rounded-full border-2 border-dashed border-gold/50 animate-spin"
          style={{ animationDuration: "6s" }}
        />
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
      <p className="mt-6 font-display text-lg font-bold">Searching for your Royal Wallet…</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-muted">
        <span className="block h-full w-1/2 animate-[shimmer_1.5s_infinite] gradient-gold" />
      </div>
    </div>
  );
}

function SuccessPanel({
  identity,
  onContinue,
}: {
  identity: RoyalWalletIdentity;
  onContinue: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <WalletSuccessCard walletId={identity.walletId} address={identity.address} />
      <button
        onClick={onContinue}
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl gradient-gold font-semibold text-navy shadow-glow transition hover:scale-[1.01]"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ProfilePanel({ onFinish }: { onFinish: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(COUNTRIES[0].code);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="mt-3 font-display text-xl font-bold">Connect your profile?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Optional — your wallet identity is your Wallet ID and Address. Add details to personalize
        the app.
      </p>

      <div className="mt-4 space-y-3">
        <Field label="Full name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ada Owusu"
            className="h-11 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="h-11 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preferred currency">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="h-11 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            >
              {CURRENCY_LIST.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Phone (optional)">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+220 3xx xxx xxx"
            className="h-11 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
          />
        </Field>
        <Field label="Email (optional)">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
            type="email"
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <button
          onClick={onFinish}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl gradient-gold font-semibold text-navy shadow-glow transition hover:scale-[1.01]"
        >
          <Check className="h-4 w-4" /> Enter Wallet
        </button>
        <button
          onClick={onFinish}
          className="grid h-12 w-full place-items-center rounded-2xl border border-border bg-card text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function PinSetupPanel({
  address,
  pin,
  setPin,
  confirmPin,
  setConfirmPin,
  pinOk,
  error,
  onContinue,
}: {
  address: string;
  pin: string;
  setPin: (value: string) => void;
  confirmPin: string;
  setConfirmPin: (value: string) => void;
  pinOk: boolean;
  error: string | null;
  onContinue: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <h2 className="mt-3 font-display text-xl font-bold">Secure this restored wallet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your phrase has been validated. Choose a new 6-digit PIN before the wallet is saved on this device.
      </p>
      <p className="mt-3 break-all rounded-xl bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
        Solana address: {address}
      </p>
      <label className="mt-4 block text-xs font-medium text-muted-foreground">
        New 6-digit PIN
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-4 text-center font-mono tracking-[0.5em]"
          placeholder="••••••"
        />
      </label>
      <label className="mt-3 block text-xs font-medium text-muted-foreground">
        Confirm PIN
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-4 text-center font-mono tracking-[0.5em]"
          placeholder="••••••"
        />
      </label>
      {confirmPin.length === 6 && !pinOk && (
        <p className="mt-2 text-xs text-destructive">PINs must match and contain exactly six digits.</p>
      )}
      {error && <div className="mt-3"><SecurityWarning title={error} /></div>}
      <button
        type="button"
        onClick={onContinue}
        disabled={!pinOk}
        className="mt-5 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
      >
        Encrypt & Restore Wallet
      </button>
    </div>
  );
}

