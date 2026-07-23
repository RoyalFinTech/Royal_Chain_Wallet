import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { NetworkGrid, ParticleField } from "@/components/brand/FxEffects";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 4)), 60);
    const nav = setTimeout(() => navigate({ to: "/onboarding" }), 2400);
    return () => {
      clearInterval(t);
      clearTimeout(nav);
    };
  }, [navigate]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden gradient-royal text-white">
      <NetworkGrid />
      <ParticleField />
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />

      {/* pulse rings behind logo */}
      <div className="relative">
        <span className="absolute inset-0 -m-6 rounded-full border border-gold/40 animate-pulse-ring" />
        <span
          className="absolute inset-0 -m-6 rounded-full border border-gold/30 animate-pulse-ring"
          style={{ animationDelay: "0.8s" }}
        />
        <div className="relative animate-in fade-in zoom-in-50 duration-700">
          <Logo size={140} />
        </div>
      </div>

      <div className="relative mt-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          <span className="text-gold-shimmer">Royal Chain</span> Wallet
        </h1>
        <p className="mt-2 text-sm text-white/70">Your Borderless Digital Wallet</p>
      </div>

      <div className="relative mt-10 w-52">
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full gradient-gold transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] text-white/50">
          Securing connection…
        </p>
      </div>
    </main>
  );
}
