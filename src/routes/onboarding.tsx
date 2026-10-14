import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { NetworkGrid } from "@/components/brand/FxEffects";
import { ArrowLeftRight, ArrowRight, Check, ShieldCheck, Wallet } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const slides = [
  {
    title: "Your Multi-Chain Crypto Wallet",
    desc: "Create a self-custody wallet for the cryptocurrency you hold and control. One recovery phrase derives addresses for Bitcoin, Ethereum, BNB Chain, and Solana.",
    bullets: [
      "Self-custody recovery phrase",
      "Bitcoin, Ethereum, BNB Chain, and Solana",
      "Keys encrypted locally with your PIN",
    ],
    icon: Wallet,
    image: "/royal-chain-wallet-onboarding.jpg",
    imageAlt: "Royal Chain Wallet premium smartphone crypto dashboard with multi-chain icons, portfolio chart and QR code",
    imageCredit: "Royal Chain Wallet artwork",
  },
  {
    title: "Your Keys. Your Responsibility.",
    desc: "Your recovery phrase can restore your wallet in compatible wallet software. Keep it offline and never share it. Royal Chain Wallet does not need to see your phrase.",
    bullets: [
      "Choose a private six-digit PIN",
      "Back up your phrase offline",
      "Never send recovery words to support",
    ],
    icon: ShieldCheck,
    image:
      "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Modern professional workspace with people collaborating around a desk",
    imageCredit: "Photo from Pexels",
  },
  {
    title: "Send and Receive Cryptocurrency",
    desc: "Review the asset, network, recipient, amount, and fee before sending. Always share the address for the matching blockchain network. Live transactions require a configured and tested network connection.",
    bullets: [
      "Check network and recipient before sending",
      "Use the correct receive address for each chain",
      "Never approve a request you do not understand",
    ],
    icon: ArrowLeftRight,
    image:
      "https://images.pexels.com/photos/6771665/pexels-photo-6771665.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Smartphone displaying cryptocurrency market trends",
    imageCredit: "Photo from Pexels",
  },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const slide = slides[i];
  const isLast = i === slides.length - 1;
  const Icon = slide.icon;

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden gradient-royal text-white">
      <NetworkGrid />
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />

      <header className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <Logo size={44} withText />
        {!isLast && (
          <button
            type="button"
            onClick={() => setI(slides.length - 1)}
            className="rounded-full px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-gold"
          >
            Skip
          </button>
        )}
      </header>

      <section className="relative z-10 flex flex-1 items-center px-5 py-7 sm:px-8 lg:px-12">
        <div
          key={i}
          className="mx-auto grid w-full max-w-6xl items-center gap-7 animate-in fade-in slide-in-from-bottom-3 duration-500 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12"
        >
          <div className="order-2 lg:order-1">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Self-custody crypto wallet
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 ring-1 ring-gold/40 backdrop-blur-xl">
              <Icon className="h-6 w-6 text-gold" />
            </div>
            <h1 className="mt-5 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              {slide.desc}
            </p>
            <ul className="mt-6 space-y-2.5">
              {slide.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white/85 backdrop-blur-sm"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full gradient-gold text-navy">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[11px] leading-5 text-white/45">
              Cryptocurrency is volatile. You control your recovery phrase and are responsible for
              checking transaction details before signing.
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <div className="group relative overflow-hidden rounded-[2rem] border border-gold/25 bg-[#071325] shadow-[0_35px_100px_-32px_rgba(0,0,0,0.8)]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-amber-400/20" />
              <img
                src={slide.image}
                alt={slide.imageAlt}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.style.opacity = "0";
                }}
                className="relative h-56 w-full object-cover transition duration-700 group-hover:scale-[1.02] sm:h-72 lg:h-[440px]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06101f]/90 via-transparent to-[#06101f]/10" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 sm:bottom-6 sm:left-6 sm:right-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
                    Royal Chain Wallet
                  </p>
                  <p className="mt-1 max-w-xs font-display text-lg font-bold text-white sm:text-xl">
                    One wallet. Multiple blockchains.
                  </p>
                  <p className="mt-1 text-[10px] text-white/50">{slide.imageCredit}</p>
                </div>
                <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl border border-gold/35 bg-black/40 backdrop-blur-md sm:grid">
                  <Logo size={32} />
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-center gap-2 lg:justify-end">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setI(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  aria-current={idx === i ? "step" : undefined}
                  className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-gold" : "w-2 bg-white/30 hover:bg-white/60"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-5 pb-7 sm:px-8 sm:pb-9 lg:px-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:justify-end">
          {isLast ? (
            <>
              <Link
                to="/import-wallet"
                className="grid h-12 place-items-center rounded-2xl border border-gold/40 bg-white/5 px-5 text-sm font-semibold text-gold transition hover:bg-white/10 sm:min-w-48"
              >
                Import Existing Wallet
              </Link>
              <Link
                to="/create-wallet"
                className="grid h-12 place-items-center rounded-2xl gradient-gold px-6 text-sm font-semibold text-navy shadow-glow transition hover:brightness-105 sm:min-w-48"
              >
                Create New Wallet
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setI((value) => Math.min(slides.length - 1, value + 1))}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl gradient-gold px-7 text-sm font-semibold text-navy shadow-glow transition hover:brightness-105 sm:min-w-48"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-5 text-center">
          <Link to="/auth/login" className="text-xs text-white/55 transition hover:text-gold">
            Already have a wallet? Sign in
          </Link>
        </div>
      </footer>
    </main>
  );
}
