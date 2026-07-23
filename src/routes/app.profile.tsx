import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import {
  ChevronRight,
  Shield,
  LogOut,
  Copy,
  QrCode,
  Pencil,
  BadgeCheck,
  Phone,
  Mail,
  Globe,
  Calendar,
  Settings,
  LifeBuoy,
  Bell,
  Fingerprint,
  X,
} from "lucide-react";
import { DEMO_IDENTITY } from "@/lib/wallet-identity";
import { useState } from "react";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState<"id" | "addr" | null>(null);

  const copy = async (what: "id" | "addr") => {
    const v = what === "id" ? DEMO_IDENTITY.walletId : DEMO_IDENTITY.address;
    await navigator.clipboard.writeText(v);
    setCopied(what);
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <div className="px-5 pt-10 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div className="relative mt-5 overflow-hidden rounded-3xl gradient-royal p-5 text-white shadow-elegant">
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/25 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center rounded-2xl gradient-gold font-display text-2xl font-bold text-navy shadow-glow">
              FN
            </div>
            <button className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-navy text-white ring-2 ring-gold">
              <Pencil className="h-3 w-3" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate font-display text-xl font-bold">
              Fatoumata Njie
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-medium text-gold ring-1 ring-gold/40">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            </p>
            <p className="mt-0.5 truncate text-xs text-white/70">Royal member since Jan 2024</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <button
                onClick={() => copy("id")}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 ring-1 ring-white/15"
              >
                <span className="text-white/60">ID</span>
                <span className="font-mono">{DEMO_IDENTITY.walletId}</span>
                <Copy className="h-3 w-3" />
                {copied === "id" && <span className="text-gold">✓</span>}
              </button>
              <button
                onClick={() => copy("addr")}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 ring-1 ring-white/15"
              >
                <span className="font-mono">{DEMO_IDENTITY.address}</span>
                <Copy className="h-3 w-3" />
                {copied === "addr" && <span className="text-gold">✓</span>}
              </button>
            </div>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-3 text-xs font-semibold ring-1 ring-white/15">
            <Pencil className="h-3.5 w-3.5" /> Edit Profile
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-xs font-semibold text-navy shadow-glow"
          >
            <QrCode className="h-3.5 w-3.5" /> View QR
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <InfoTile icon={Phone} label="Phone" value="+220 302 45 67" />
        <InfoTile icon={Mail} label="Email" value="fatou@royalchain.com" />
        <InfoTile icon={Globe} label="Country" value="🇬🇲 Gambia" />
        <InfoTile icon={Calendar} label="Member since" value="Jan 2024" />
      </div>

      {/* Security status */}
      <Link
        to="/app/security"
        className="mt-4 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-success/20 text-success">
          <Shield className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-success">Wallet fully protected</p>
          <p className="text-xs text-success/80">Biometrics on · 2FA active · Recovery saved</p>
        </div>
        <ChevronRight className="h-4 w-4 text-success" />
      </Link>

      {/* Navigation */}
      <div className="mt-5 space-y-2">
        <NavRow
          to="/app/settings"
          icon={Settings}
          label="Settings"
          desc="Language, currency, appearance"
        />
        <NavRow
          to="/app/notifications"
          icon={Bell}
          label="Notifications"
          desc="Manage alerts and sounds"
        />
        <NavRow
          to="/app/security"
          icon={Fingerprint}
          label="Security Center"
          desc="PIN, 2FA, devices"
        />
        <NavRow to="/app/support" icon={LifeBuoy} label="Support" desc="Help, contact, community" />
      </div>

      <button
        onClick={() => navigate({ to: "/auth/login" })}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 text-sm font-semibold text-destructive"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>

      {showQR && <QRPreview onClose={() => setShowQR(false)} />}
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: import("lucide-react").LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-gold" /> {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function NavRow({
  to,
  icon: Icon,
  label,
  desc,
}: {
  to: string;
  icon: import("lucide-react").LucideIcon;
  label: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:shadow-soft"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function QRPreview({ onClose }: { onClose: () => void }) {
  const size = 19;
  const cells = Array.from({ length: size * size }, (_, i) => {
    const x = i % size,
      y = Math.floor(i / size);
    const finder = (x < 3 && y < 3) || (x > size - 4 && y < 3) || (x < 3 && y > size - 4);
    const s = (x * 92821 + y * 12345 + DEMO_IDENTITY.walletId.length * 7919) & 15;
    return finder || s < 7;
  });
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-background p-5 shadow-elegant"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-lg font-bold">My Wallet QR</p>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {cells.map((on, i) => (
              <span
                key={i}
                className={`aspect-square rounded-[1px] ${on ? "bg-navy" : "bg-transparent"}`}
              />
            ))}
          </div>
        </div>
        <p className="mt-3 text-center font-mono text-xs text-muted-foreground">
          {DEMO_IDENTITY.walletId}
        </p>
      </div>
    </div>
  );
}
