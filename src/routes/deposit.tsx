import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { DEPOSIT_METHODS, formatMoney } from "@/lib/mock-data";

export const Route = createFileRoute("/deposit")({
  component: Deposit,
});

function Deposit() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();
  const chosen = DEPOSIT_METHODS.find((m) => m.id === method);

  const back = () => (step === 1 ? navigate({ to: "/app" }) : setStep((s) => (s - 1) as 1 | 2));

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-14">
      <header className="flex items-center gap-3 px-5 pt-10">
        <button onClick={back} className="grid h-10 w-10 place-items-center rounded-full glass">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-xl font-bold">Add Money</h1>
      </header>

      <div className="px-5 pt-6">
        {step === 1 && (
          <>
            <p className="text-sm text-muted-foreground">Choose a deposit method</p>
            <div className="mt-4 space-y-3">
              {DEPOSIT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMethod(m.id);
                    setStep(2);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:shadow-soft"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-2xl">
                    {m.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium">
                    {m.fee}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && chosen && (
          <>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold/10 text-xl">
                {chosen.icon}
              </span>
              <p className="font-semibold">{chosen.name}</p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Amount (D)</p>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0.00"
                className="mt-2 w-full bg-transparent text-center font-display text-5xl font-bold outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[500, 1000, 2500, 5000, 10000].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-xs"
                >
                  D{v.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-2xl bg-success/10 p-3 text-xs text-success">
              <ShieldCheck className="h-4 w-4" /> Secure via {chosen.name} · {chosen.fee} fee
            </div>

            <button
              disabled={!amount || Number(amount) <= 0}
              onClick={() => setStep(3)}
              className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow disabled:opacity-50"
            >
              Confirm Deposit
            </button>
          </>
        )}

        {step === 3 && chosen && (
          <div className="pt-6 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full gradient-gold text-navy shadow-glow">
              <span className="absolute inset-0 rounded-full border border-gold/50 animate-pulse-ring" />
              <Check className="h-10 w-10" strokeWidth={3} />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold">Deposit Successful</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMoney(Number(amount))} added via {chosen.name}
            </p>

            <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-5 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">{chosen.name}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-display font-bold">{formatMoney(Number(amount))}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">DEP-{Date.now().toString().slice(-8)}</span>
              </div>
            </div>

            <Link
              to="/app"
              className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow"
            >
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
