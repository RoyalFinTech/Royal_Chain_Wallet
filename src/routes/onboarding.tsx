import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { NetworkGrid } from "@/components/brand/FxEffects";
import { ArrowRight, Check, Sparkles, ShieldCheck, Zap } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const slides = [
  {
    title: "Your Borderless Digital Wallet",
    desc: "Own, send and receive money anywhere in the world with your Royal Chain Wallet identity.",
    bullets: ["Self-owned Wallet ID", "Multi-currency by default", "Global transfers in seconds"],
    icon: Sparkles,
  },
  {
    title: "Blockchain-grade Security",
    desc: "Encrypted keys, recovery phrase and biometric protection keep your funds sovereign.",
    bullets: ["Recovery phrase", "Biometric login", "24/7 fraud monitoring"],
    icon: ShieldCheck,
  },
  {
    title: "One Wallet. Endless Possibilities.",
    desc: "Hold USD, EUR, GBP, GMD, NGN and XOF. Pay merchants, exchange currencies, scan QR — all in one place.",
    bullets: ["6+ currencies", "Instant QR payments", "Business & merchant ready"],
    icon: Zap,
  },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const slide = slides[i];
  const isLast = i === slides.length - 1;
  const Icon = slide.icon;

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden gradient-royal text-white">
      <NetworkGrid />
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />

      <header className="relative flex items-center justify-between px-6 pt-8">
        <Logo size={40} />
        {!isLast && (
          <button
            onClick={() => setI(slides.length - 1)}
            className="text-sm text-white/70 hover:text-gold"
          >
            Skip
          </button>
        )}
      </header>

      <section className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-white/5 ring-1 ring-gold/40 backdrop-blur-xl">
            <Icon className="h-10 w-10 text-gold" />
          </div>
          <h1 className="mt-8 font-display text-3xl font-bold leading-tight tracking-tight">
            {slide.title}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-white/70">{slide.desc}</p>
          <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
            {slide.bullets.map((b) => (
              <li
                key={b}
                className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full gradient-gold text-navy">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-white/85">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="relative px-6 pb-10">
        <div className="mb-6 flex justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-gold" : "w-2 bg-white/30"}`}
            />
          ))}
        </div>

        {isLast ? (
          <div className="flex flex-col gap-3">
            <Link
              to="/create-wallet"
              className="grid h-14 place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow transition hover:scale-[1.01]"
            >
              Create New Wallet
            </Link>
            <Link
              to="/import-wallet"
              className="grid h-14 place-items-center rounded-2xl border border-gold/40 bg-white/5 font-semibold text-gold transition hover:bg-white/10"
            >
              Import Existing Wallet
            </Link>
            <Link
              to="/auth/login"
              className="grid h-12 place-items-center rounded-2xl text-sm font-medium text-white/70 transition hover:text-white"
            >
              I already have an account · Login
            </Link>
          </div>
        ) : (
          <button
            onClick={() => setI(i + 1)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl gradient-gold font-semibold text-navy shadow-glow transition hover:scale-[1.01]"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </footer>
    </main>
  );
}
