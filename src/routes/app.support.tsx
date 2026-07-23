import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  LifeBuoy,
  HelpCircle,
  MessageCircle,
  Mail,
  Bug,
  Sparkles,
  Users,
  Info,
  FileText,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/app/support")({
  component: SupportCenter,
});

const CARDS = [
  { icon: LifeBuoy, title: "Help Center", desc: "Guides & tutorials", to: "/support" },
  { icon: HelpCircle, title: "FAQs", desc: "Popular questions", to: "/support" },
  { icon: MessageCircle, title: "Live Chat", desc: "Avg reply · 2 min", to: "/support" },
  { icon: Mail, title: "Email Support", desc: "support@royalchain.com", to: "/support" },
  { icon: Bug, title: "Report a Bug", desc: "Something isn't right?", to: "/support" },
  { icon: Sparkles, title: "Feature Request", desc: "Shape the roadmap", to: "/support" },
  { icon: Users, title: "Community", desc: "Join the Royal circle", to: "/support" },
  { icon: Info, title: "About Royal Chain", desc: "Mission & team", to: "/about" },
  { icon: ShieldCheck, title: "Privacy Policy", desc: "How we protect you", to: "/legal/privacy" },
  { icon: FileText, title: "Terms of Service", desc: "The fine print", to: "/legal/terms" },
] as const;

function SupportCenter() {
  return (
    <div className="px-5 pt-10 pb-6">
      <div className="flex items-center gap-3">
        <Link to="/app/profile" className="grid h-10 w-10 place-items-center rounded-full glass">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold">Support</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">We're here 24/7 across every channel.</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {CARDS.map((c) => (
          <Link
            key={c.title}
            to={c.to}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5"
          >
            <div className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-gold/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/10 text-gold ring-1 ring-gold/20 transition group-hover:gradient-gold group-hover:text-navy group-hover:shadow-glow">
              <c.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold">{c.title}</p>
            <p className="text-[11px] text-muted-foreground">{c.desc}</p>
            <ChevronRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-5">
        <p className="font-display text-lg font-bold">Still stuck?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Our agents can screen-share and walk you through anything.
        </p>
        <button className="mt-3 h-11 w-full rounded-2xl gradient-gold text-sm font-semibold text-navy shadow-glow">
          Talk to a human
        </button>
      </div>
    </div>
  );
}
