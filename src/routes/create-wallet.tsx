import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NetworkGrid } from "@/components/brand/FxEffects";
import { CURRENCY_LIST, type CurrencyCode } from "@/lib/currencies";
import { COUNTRIES } from "@/lib/mock-data";
import { importWallet, shortenAddress, validateMnemonic } from "@/lib/wallet";
import { deriveAllChains, generateMnemonic, type DerivedAddresses } from "@/lib/wallet/derive";

export const Route = createFileRoute("/create-wallet")({
  component: CreateWallet,
});

type Step = 1 | 2 | 3 | 4 | 5;
type WalletPreview = { addresses: DerivedAddresses; wordCount: 12 | 24 };

function CreateWallet() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [mnemonic, setMnemonic] = useState<string[] | null>(null);
  const [preview, setPreview] = useState<WalletPreview | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [pin, setPin] = useState(Array(6).fill(""));
  const [confirmPin, setConfirmPin] = useState(Array(6).fill(""));
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    country: COUNTRIES[0].code,
    currency: "USD" as CurrencyCode,
  });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Generate the recovery phrase and derive preview addresses in memory only.
  // Never write a wallet to storage until the user has chosen a personal PIN.
  useEffect(() => {
    let cancelled = false;
    setGenError(null);
    setPreview(null);
    setMnemonic(null);

    (async () => {
      try {
        if (!globalThis.crypto?.getRandomValues) {
          throw new Error("Secure browser randomness is unavailable. Open this page over HTTPS in a supported browser.");
        }

        const generatedMnemonic = generateMnemonic(128);
        if (!validateMnemonic(generatedMnemonic)) {
          throw new Error("The recovery phrase generator returned an invalid BIP-39 phrase.");
        }

        const addresses = await deriveAllChains(generatedMnemonic);
        if (
          !addresses.bitcoin.address ||
          !addresses.ethereum.address ||
          !addresses.bnb.address ||
          !addresses.solana.address
        ) {
          throw new Error("One or more blockchain addresses could not be derived.");
        }

        if (cancelled) return;
        setMnemonic(generatedMnemonic.split(" "));
        setPreview({ addresses, wordCount: 12 });
      } catch (e) {
        const reason = e instanceof Error ? e.message : "Unknown wallet-generation error";
        // Log the cause only; never log a mnemonic or private key.
        console.error("[wallet] Recovery phrase/address generation failed:", reason);
        if (!cancelled) {
          setGenError("Wallet generation failed. No wallet was saved. Check your connection and retry.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [generationAttempt]);

  const verifyIndices = useMemo(() => [2, 5, 8], []); // words #3, #6, #9
  const [verifyInputs, setVerifyInputs] = useState<Record<number, string>>({});

  const copyPhrase = async () => {
    if (!mnemonic) return;
    await navigator.clipboard.writeText(mnemonic.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const back = () =>
    step === 1 ? navigate({ to: "/onboarding" }) : setStep((s) => (s - 1) as Step);

  const verifyOk = mnemonic
    ? verifyIndices.every((i) => (verifyInputs[i] || "").trim().toLowerCase() === mnemonic[i])
    : false;
  const pinOk = pin.every((d) => d !== "") && pin.join("") === confirmPin.join("");

  // On step 4 → 5, persist the wallet encrypted with the user's real PIN.
  async function commitPinAndContinue() {
    if (!mnemonic || !pinOk) return;
    setSaving(true);
    try {
      const stored = await importWallet(mnemonic.join(" "), pin.join(""));
      setPreview({ addresses: stored.addresses, wordCount: stored.wordCount });
      // Remove secrets from React component state once encrypted storage is written.
      setMnemonic(null);
      setVerifyInputs({});
      setReveal(false);
      setPin(Array(6).fill(""));
      setConfirmPin(Array(6).fill(""));
      setStep(5);
    } catch (e) {
      console.error(e);
      setGenError("Could not secure your wallet. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const next = () => {
    if (step === 4) {
      void commitPinAndContinue();
      return;
    }
    setStep((s) => Math.min(5, s + 1) as Step);
  };

  return (
    <div className="relative min-h-dvh bg-background">
      <div className="relative overflow-hidden gradient-royal pb-16 pt-8 text-white">
        <NetworkGrid />
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
        <header className="relative mx-auto flex w-full max-w-md items-center justify-between px-5">
          <button
            onClick={back}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Logo size={32} />
          <span className="w-10" />
        </header>
        <div className="relative mx-auto mt-6 w-full max-w-md px-5">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 rounded-full ${n <= step ? "gradient-gold" : "bg-white/15"}`}
              />
            ))}
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-white/60">
            Step {step} of 5
          </p>
        </div>
      </div>

      <main className="relative mx-auto -mt-10 w-full max-w-md px-4 pb-16">
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-elegant sm:p-8">
          {step === 1 && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-3 duration-400">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
                <Sparkles className="h-7 w-7" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold">Create Your Royal Wallet</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your borderless digital wallet — owned by you, secured by cryptography.
              </p>

              <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-4 text-left">
                <p className="flex items-center gap-2 text-sm font-semibold text-success">
                  {preview ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {preview ? "Wallet Preview Ready" : genError ? "Wallet generation failed" : "Generating your multi-chain wallet…"}
                </p>
                {preview && (
                  <div className="mt-3 space-y-2 text-xs">
                    <IdRow
                      label="Solana Address"
                      value={shortenAddress(preview.addresses.solana.address, 6, 6)}
                      mono
                    />
                    <IdRow
                      label="Bitcoin Address"
                      value={shortenAddress(preview.addresses.bitcoin.address, 6, 6)}
                      mono
                    />
                    <IdRow
                      label="Ethereum Address"
                      value={shortenAddress(preview.addresses.ethereum.address, 6, 6)}
                      mono
                    />
                    <IdRow label="Network" value="Bitcoin · Ethereum · BNB Chain · Solana" />
                    <IdRow label="Recovery Words" value={`${preview.wordCount}-word phrase`} />
                  </div>
                )}
                {genError && (
                  <div className="mt-3" role="alert">
                    <p className="text-xs text-destructive">{genError}</p>
                    <button
                      type="button"
                      onClick={() => setGenerationAttempt((attempt) => attempt + 1)}
                      className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:border-gold"
                    >
                      Retry wallet generation
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={next}
                disabled={!preview || !mnemonic}
                className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
              >
                Continue to Recovery <ArrowRight className="ml-2 inline h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-400">
              <h1 className="font-display text-2xl font-bold">Secure your recovery phrase</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your recovery phrase is the key to your wallet.
              </p>

              <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <p className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="h-4 w-4" /> Never share your recovery phrase
                </p>
                <p className="mt-1 text-destructive/80">
                  Royal Chain Wallet will never ask you for it.
                </p>
              </div>

              <div className="relative mt-5">
                <div
                  className={`grid grid-cols-3 gap-2 rounded-2xl border border-border bg-muted/40 p-3 transition ${reveal ? "" : "blur-md select-none"}`}
                >
                  {(mnemonic ?? Array(12).fill("")).map((w: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 rounded-xl bg-card px-2 py-2 text-xs"
                    >
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span className="font-medium">{w || "—"}</span>
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
                  {copied ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}{" "}
                  {copied ? "Copied" : "Copy phrase"}
                </button>
                <button
                  onClick={() => setReveal((r) => !r)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-full border border-border bg-card py-2 text-xs"
                >
                  {reveal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{" "}
                  {reveal ? "Hide" : "Show"}
                </button>
              </div>

              <button
                disabled={!reveal}
                onClick={next}
                className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
              >
                I Have Saved My Phrase
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-400">
              <h1 className="font-display text-2xl font-bold">Confirm your phrase</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the requested words to verify you saved them.
              </p>

              <div className="mt-5 space-y-3">
                {verifyIndices.map((i) => (
                  <label key={i} className="block">
                    <span className="text-xs font-medium text-muted-foreground">Word #{i + 1}</span>
                    <input
                      value={verifyInputs[i] || ""}
                      onChange={(e) => setVerifyInputs({ ...verifyInputs, [i]: e.target.value })}
                      className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
                      placeholder={`Enter word #${i + 1}`}
                    />
                  </label>
                ))}
              </div>

              <button
                disabled={!verifyOk}
                onClick={next}
                className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-400">
              <h1 className="font-display text-2xl font-bold">Create Security PIN</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a 6-digit PIN to unlock your wallet.
              </p>

              <PinInput label="New PIN" value={pin} onChange={setPin} idPrefix="new" />
              <PinInput
                label="Confirm PIN"
                value={confirmPin}
                onChange={setConfirmPin}
                idPrefix="confirm"
              />

              {confirmPin.every((d) => d !== "") && !pinOk && (
                <p className="mt-2 text-xs text-destructive">PINs don't match.</p>
              )}

              <button
                disabled={!pinOk || saving}
                onClick={next}
                className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Secure Wallet"}
              </button>
              {genError && <p className="mt-2 text-xs text-destructive">{genError}</p>}
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-400">
              <h1 className="font-display text-2xl font-bold">Profile setup</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Optional — helps personalize your wallet.
              </p>

              <div className="mt-5 space-y-3">
                <Field
                  label="Full name"
                  value={profile.name}
                  onChange={(v) => setProfile({ ...profile, name: v })}
                  placeholder="Your full name"
                />
                <Field
                  label="Phone number"
                  value={profile.phone}
                  onChange={(v) => setProfile({ ...profile, phone: v })}
                  placeholder="+220 3xx xxx xxx"
                />
                <Field
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(v) => setProfile({ ...profile, email: v })}
                  placeholder="you@example.com"
                />

                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className="text-xs font-medium text-muted-foreground">Country</span>
                    <select
                      value={profile.country}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                      className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-xs font-medium text-muted-foreground">Currency</span>
                    <select
                      value={profile.currency}
                      onChange={(e) =>
                        setProfile({ ...profile, currency: e.target.value as CurrencyCode })
                      }
                      className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-3 text-sm"
                    >
                      {CURRENCY_LIST.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-xs text-success">
                <ShieldCheck className="h-4 w-4" /> Your wallet is encrypted end-to-end.
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate({ to: "/app" })}
                  className="grid h-14 flex-1 place-items-center rounded-2xl border border-border bg-card font-semibold text-foreground"
                >
                  Skip
                </button>
                <button
                  onClick={() => navigate({ to: "/app" })}
                  className="grid h-14 flex-1 place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow"
                >
                  Enter Wallet
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Already have a wallet?{" "}
          <Link to="/auth/login" className="font-semibold text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}

function IdRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-background/60 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-foreground" : "font-semibold text-foreground"}>
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: { label: string; value: string; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
      />
    </label>
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
    <div className="mt-4">
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
