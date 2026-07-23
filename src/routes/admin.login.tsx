import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Shield, ArrowLeft, KeyRound } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NetworkGrid } from "@/components/brand/FxEffects";
import { useState } from "react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <div className="relative min-h-dvh overflow-hidden gradient-royal text-white">
      <NetworkGrid />
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" />

      <header className="relative mx-auto flex max-w-md items-center justify-between px-5 pt-10">
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-full glass-dark">
          <ArrowLeft className="h-4 w-4 text-white" />
        </Link>
        <Logo size={36} />
      </header>

      <main className="relative mx-auto flex max-w-md flex-col items-center px-5 pt-10">
        <div className="relative">
          <span className="absolute inset-0 rounded-full border border-gold/40 animate-pulse-ring" />
          <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
            <Shield className="h-7 w-7" />
          </div>
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold">Admin Portal</h1>
        <p className="mt-1 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-[11px] text-red-200">
          Restricted Area · Authorized personnel only
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 1) {
              setStep(2);
            } else {
              navigate({ to: "/admin" });
            }
          }}
          className="mt-8 w-full rounded-3xl border border-gold/20 bg-white/5 p-6 backdrop-blur-xl"
        >
          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-white/60">Email</span>
                <input
                  type="email"
                  required
                  placeholder="admin@royalchain.com"
                  className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 focus:border-gold/60 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-white/60">Password</span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 focus:border-gold/60 focus:outline-none"
                />
              </label>
              <button className="grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow">
                Continue
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-center">
              <KeyRound className="mx-auto h-8 w-8 text-gold" />
              <p className="mt-3 text-sm text-white/80">
                Enter the 6-digit 2FA code from your authenticator app.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    inputMode="numeric"
                    maxLength={1}
                    className="h-12 w-9 rounded-xl border border-white/10 bg-white/5 text-center text-lg font-semibold text-white focus:border-gold/60 focus:outline-none"
                  />
                ))}
              </div>
              <button className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow">
                Verify & Enter
              </button>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-[11px] text-white/50">
          All admin activity is logged & monitored.
        </p>
      </main>
    </div>
  );
}
