import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft, LifeBuoy, MessageCircle, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/support")({
  component: Support,
  head: () => ({ meta: [{ title: "Support — Royal Chain Wallet" }] }),
});

function Support() {
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
        <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
          <LifeBuoy className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold">How can we help?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Our team is available 24/7 to assist with any wallet issue.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: MessageCircle, title: "Live chat", sub: "Avg. 2 min reply" },
            { icon: Mail, title: "Email", sub: "support@royalchain.com" },
            { icon: Phone, title: "Call us", sub: "+220 800 12 12" },
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

        <h2 className="mt-10 font-display text-lg font-bold">Popular topics</h2>
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {[
            "Reset my PIN",
            "Enable biometrics",
            "Failed transaction",
            "Add a new payment method",
            "Contact an agent",
          ].map((t) => (
            <button
              key={t}
              className="flex w-full items-center justify-between p-4 text-left text-sm hover:bg-muted/40"
            >
              {t}
              <span className="text-gold">→</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
