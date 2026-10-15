import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Fingerprint, Hash, Phone } from "lucide-react";
import { COUNTRIES } from "@/lib/mock-data";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

type Method = "wallet" | "phone" | "biometric";

function Login() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("wallet");
  const [walletId, setWalletId] = useState("RCW-");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [show, setShow] = useState(false);

  const setDigit = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...pin];
    next[i] = v;
    setPin(next);
    if (v && i < 5) document.getElementById(`pin-${i + 1}`)?.focus();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Access your Royal Chain Wallet.</p>

      <div className="mt-5 grid grid-cols-3 gap-1 rounded-full border border-border bg-muted/40 p-1 text-xs font-medium">
        {[
          { id: "wallet" as const, label: "Wallet ID", icon: Hash },
          { id: "phone" as const, label: "Phone", icon: Phone },
          { id: "biometric" as const, label: "Biometric", icon: Fingerprint },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMethod(id)}
            className={`flex items-center justify-center gap-1 rounded-full px-2 py-2 transition ${method === id ? "gradient-gold text-navy shadow-soft" : "text-muted-foreground"}`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/app" });
        }}
        className="mt-6 space-y-4"
      >
        {method === "wallet" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Royal Wallet ID</label>
            <input
              value={walletId}
              onChange={(e) => setWalletId(e.target.value.toUpperCase())}
              placeholder="RCW-XXXX-XXXX"
              className="mt-1 h-12 w-full rounded-2xl border border-border bg-input/40 px-4 font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-gold/60"
            />
          </div>
        )}

        {method === "phone" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Phone number</label>
            <div className="mt-1 flex overflow-hidden rounded-2xl border border-border bg-input/40 focus-within:ring-2 focus-within:ring-gold/60">
              <select
                aria-label="Country calling code"
                value={country.code}
                onChange={(e) => setCountry(COUNTRIES.find((c) => c.code === e.target.value)!)}
                className="border-r border-border bg-transparent px-3 text-sm focus:outline-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dial})
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="3xx xxx xxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none"
              />
            </div>
          </div>
        )}

        {method === "biometric" ? (
          <div className="rounded-3xl border border-border bg-card p-6 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full gradient-gold text-navy shadow-glow">
              <Fingerprint className="h-9 w-9" />
            </div>
            <p className="mt-4 font-display text-sm font-bold">Touch to unlock</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use Face ID or fingerprint to access your wallet.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/app" })}
              className="mt-4 grid h-12 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow"
            >
              Authenticate
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Wallet PIN</label>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-2">
                  {pin.map((d, i) => (
                    <input
                      key={i}
                      id={`pin-${i}`}
                      type={show ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => setDigit(i, e.target.value)}
                      className="h-12 w-full rounded-2xl border border-border bg-input/40 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gold/60"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <Link to="/auth/forgot" className="font-medium text-gold hover:underline">
                Forgot PIN?
              </Link>
              <Link to="/auth/recover" className="font-medium text-gold hover:underline">
                Recover Wallet
              </Link>
            </div>

            <button
              type="submit"
              className="grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow transition hover:scale-[1.01]"
            >
              Unlock Wallet
            </button>
          </>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/create-wallet" className="font-semibold text-gold hover:underline">
          Create Royal Wallet
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Already have a wallet elsewhere?{" "}
        <Link to="/import-wallet" className="font-semibold text-gold hover:underline">
          Import Existing Wallet
        </Link>
      </p>
    </div>
  );
}
