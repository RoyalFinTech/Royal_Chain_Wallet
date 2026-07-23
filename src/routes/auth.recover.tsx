import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, ShieldCheck, Check } from "lucide-react";

export const Route = createFileRoute("/auth/recover")({
  component: Recover,
});

function Recover() {
  const navigate = useNavigate();
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const filled = words.filter((w) => w.trim() !== "").length;

  const set = (i: number, v: string) => {
    const next = [...words];
    next[i] = v.trim().toLowerCase();
    setWords(next);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
        <KeyRound className="h-5 w-5" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold">Recover your wallet</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your 12-word recovery phrase in the correct order to restore access.
      </p>

      <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-3">
        <div className="grid grid-cols-3 gap-2">
          {words.map((w, i) => (
            <div key={i} className="flex items-center gap-1 rounded-xl bg-card px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">{i + 1}.</span>
              <input
                value={w}
                onChange={(e) => set(i, e.target.value)}
                className="min-w-0 flex-1 bg-transparent font-medium outline-none"
                placeholder="word"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-xs text-success">
        <ShieldCheck className="h-4 w-4" />
        Your recovery phrase is never sent to our servers.
      </div>

      <button
        disabled={filled < 12}
        onClick={() => navigate({ to: "/app" })}
        className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
      >
        <span className="inline-flex items-center gap-2">
          <Check className="h-4 w-4" /> Restore Wallet
        </span>
      </button>

      <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm">
        <Link to="/import-wallet" className="font-semibold text-gold hover:underline">
          More import options (backup file · private key)
        </Link>
        <Link to="/auth/login" className="text-muted-foreground hover:text-foreground">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
