import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft, ShieldCheck, Sparkles, Globe2 } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({ meta: [{ title: "About — Royal Chain Wallet" }] }),
});

function About() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link to="/app" className="grid h-9 w-9 place-items-center rounded-full glass">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo size={32} withText />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs uppercase tracking-widest text-gold">About us</p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          Financial empowerment for a new generation.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Royal Chain Wallet is built by Royal FinTech Company to deliver secure, modern digital
          banking to millions across Africa. Our mission is to make everyday payments effortless
          while keeping your money — and your privacy — protected.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Secure by design",
              sub: "Bank-grade encryption on every transaction.",
            },
            {
              icon: Sparkles,
              title: "Elegant experience",
              sub: "Premium interface built for modern users.",
            },
            { icon: Globe2, title: "Pan-African", sub: "Local currencies, worldwide reach." },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/10 text-gold">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
