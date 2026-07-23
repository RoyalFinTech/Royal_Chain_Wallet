import { createFileRoute, Link } from "@tanstack/react-router";
import {
  KeyRound,
  Lock,
  Fingerprint,
  Smartphone,
  History,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  QrCode,
  MessageSquare,
  Mail,
  FileKey2,
  MapPin,
  Check,
  X,
  Trash2,
  Pencil,
  LogOut,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { useStoredWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/app/security")({
  component: Security,
});

interface Device {
  id: string;
  name: string;
  os: string;
  browser: string;
  location: string;
  lastActive: string;
  current?: boolean;
}
const DEVICES: Device[] = [
  {
    id: "d1",
    name: "iPhone 15 Pro",
    os: "iOS 18",
    browser: "Royal Chain App",
    location: "Banjul, GM",
    lastActive: "Active now",
    current: true,
  },
  {
    id: "d2",
    name: "MacBook Pro",
    os: "macOS 15",
    browser: "Safari",
    location: "Serrekunda, GM",
    lastActive: "2 hours ago",
  },
  {
    id: "d3",
    name: "Pixel 8",
    os: "Android 15",
    browser: "Chrome",
    location: "Dakar, SN",
    lastActive: "Yesterday",
  },
];

interface LoginRow {
  at: string;
  ip: string;
  loc: string;
  device: string;
  ok: boolean;
}
const LOGINS: LoginRow[] = [
  {
    at: "Today · 09:14",
    ip: "196.223.10.42",
    loc: "Banjul, GM",
    device: "iPhone 15 Pro",
    ok: true,
  },
  { at: "Today · 07:02", ip: "196.223.10.42", loc: "Banjul, GM", device: "MacBook Pro", ok: true },
  { at: "Yesterday · 21:38", ip: "41.212.99.17", loc: "Dakar, SN", device: "Pixel 8", ok: true },
  { at: "Jul 8 · 03:11", ip: "185.220.101.6", loc: "Unknown", device: "Unknown", ok: false },
  {
    at: "Jul 7 · 18:44",
    ip: "196.223.10.42",
    loc: "Banjul, GM",
    device: "iPhone 15 Pro",
    ok: true,
  },
];

interface Approval {
  id: string;
  amount: string;
  wallet: string;
  date: string;
  method: string;
  type: "pending" | "approved" | "rejected" | "cancelled";
}
const APPROVALS: Approval[] = [
  {
    id: "a1",
    amount: "$1,200.00",
    wallet: "RCW-8842-1930",
    date: "Today · 10:04",
    method: "Biometric",
    type: "pending",
  },
  {
    id: "a2",
    amount: "$450.00",
    wallet: "RCW-8842-1930",
    date: "Yesterday",
    method: "PIN",
    type: "approved",
  },
  {
    id: "a3",
    amount: "$2,400.00",
    wallet: "RCW-8842-1930",
    date: "Jul 8",
    method: "Biometric",
    type: "approved",
  },
  {
    id: "a4",
    amount: "$980.00",
    wallet: "RCW-8842-1930",
    date: "Jul 7",
    method: "PIN",
    type: "rejected",
  },
];

function Security() {
  const wallet = useStoredWallet();
  const [tfa, setTfa] = useState({ app: true, sms: true, email: false });
  const [biometrics, setBiometrics] = useState(true);
  const [loginRange, setLoginRange] = useState<"30" | "90" | "all">("30");
  const [approvalFilter, setApprovalFilter] = useState<Approval["type"] | "all">("all");

  const checks = [
    biometrics,
    tfa.app || tfa.sms || tfa.email,
    !!wallet,
    tfa.email /* email verified proxy */,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  if (!wallet) {
    return (
      <div className="px-5 pt-10 pb-6 text-center">
        <h1 className="font-display text-2xl font-bold">Security Center</h1>
        <div className="mx-auto mt-8 max-w-xs rounded-3xl border border-dashed border-border bg-card p-8">
          <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">No wallet yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create or import a wallet to see your security score, devices, and recovery options.
          </p>
          <Link
            to="/create-wallet"
            className="mt-5 grid h-12 w-full place-items-center rounded-2xl gradient-gold text-sm font-semibold text-navy shadow-glow"
          >
            Create a Wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-6">
      <h1 className="font-display text-2xl font-bold">Security Center</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Control every layer that protects your wallet.
      </p>

      {/* A · Security Score */}
      <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <ScoreRing value={score} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold">{score}% Secure</p>
            <p className="text-xs text-muted-foreground">
              Your wallet score improves as you enable more layers.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
          <Suggestion done={biometrics} label="Enable biometrics" />
          <Suggestion
            done={tfa.app || tfa.sms || tfa.email}
            label="Enable Two-Factor Authentication"
          />
          <Suggestion done={tfa.email} label="Verify your email" />
          <Suggestion done label="Recovery phrase saved" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
        <AlertTriangle className="h-4 w-4" /> Never share your recovery phrase or PIN with anyone.
      </div>

      {/* Quick actions */}
      <div className="mt-5 space-y-2">
        <QuickLink
          to="/app/export-phrase"
          icon={KeyRound}
          label="Recovery Phrase"
          desc="View and back up your recovery phrase"
          badge="Critical"
        />
        <QuickLink
          to="/app/change-pin"
          icon={Lock}
          label="Change PIN"
          desc="Update your 6-digit wallet PIN"
        />
        <ToggleRow
          icon={Fingerprint}
          label="Biometric Login"
          desc="Face ID / Fingerprint unlock"
          on={biometrics}
          onChange={setBiometrics}
        />
      </div>

      {/* B · Two-Factor Authentication */}
      <SectionHeader
        title="Two-Factor Authentication"
        hint={tfa.app || tfa.sms || tfa.email ? "Active" : "Disabled"}
      />
      <div className="space-y-2">
        <ToggleRow
          icon={QrCode}
          label="Authenticator app"
          desc="Google Authenticator, Authy"
          on={tfa.app}
          onChange={(v) => setTfa((t) => ({ ...t, app: v }))}
        />
        <ToggleRow
          icon={MessageSquare}
          label="SMS code"
          desc="Sent to +220 ••• 45 67"
          on={tfa.sms}
          onChange={(v) => setTfa((t) => ({ ...t, sms: v }))}
        />
        <ToggleRow
          icon={Mail}
          label="Email code"
          desc="fatou@royalchain.com"
          on={tfa.email}
          onChange={(v) => setTfa((t) => ({ ...t, email: v }))}
        />
        <QuickLink
          to="/app/security"
          icon={FileKey2}
          label="Backup & Recovery Codes"
          desc="Generate 10 one-time backup codes"
        />
      </div>

      {/* C · Trusted Devices */}
      <SectionHeader title="Trusted Devices" hint={`${DEVICES.length} active`} />
      <div className="space-y-2">
        {DEVICES.map((d) => (
          <div key={d.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                <Smartphone className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {d.name}
                  {d.current && (
                    <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
                      This device
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {d.os} · {d.browser}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {d.location} · {d.lastActive}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <IconAction icon={Pencil} label="Rename" />
              <IconAction icon={LogOut} label="Sign out" />
              {!d.current && <IconAction icon={Trash2} label="Remove" tone="destructive" />}
            </div>
          </div>
        ))}
      </div>

      {/* D · Login History */}
      <SectionHeader title="Login History" hint="Recent access" />
      <div className="mb-2 flex gap-1.5">
        {(["30", "90", "all"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setLoginRange(r)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium ${
              loginRange === r ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            }`}
          >
            {r === "all" ? "All" : `${r} days`}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {LOGINS.map((l, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 text-xs ${i < LOGINS.length - 1 ? "border-b border-border" : ""}`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${l.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
            >
              {l.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{l.device}</p>
              <p className="truncate text-muted-foreground">
                <Clock className="mr-1 inline h-3 w-3" />
                {l.at} · {l.loc}
              </p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{l.ip}</span>
          </div>
        ))}
      </div>

      {/* E · Transaction Approval History */}
      <SectionHeader
        title="Transaction Approvals"
        hint={`${APPROVALS.filter((a) => a.type === "pending").length} pending`}
      />
      <div className="mb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
        {(["all", "pending", "approved", "rejected", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setApprovalFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium capitalize ${
              approvalFilter === f ? "bg-gold text-navy" : "bg-muted text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {APPROVALS.filter((a) => approvalFilter === "all" || a.type === approvalFilter).map((a) => {
          const tone = {
            pending: "bg-gold/10 text-gold ring-gold/30",
            approved: "bg-success/10 text-success ring-success/30",
            rejected: "bg-destructive/10 text-destructive ring-destructive/30",
            cancelled: "bg-muted text-muted-foreground ring-border",
          }[a.type];
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{a.amount}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.wallet} · {a.date} · {a.method}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${tone}`}
              >
                {a.type}
              </span>
            </div>
          );
        })}
      </div>

      <SectionHeader title="Other" />
      <QuickLink
        to="/app/security"
        icon={History}
        label="Session log"
        desc="Every action, chronologically"
      />

      <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Transaction approvals</p>
        <p className="mt-1">Every transfer above $500 requires biometric or PIN approval.</p>
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (c * value) / 100;
  return (
    <div className="relative grid h-16 w-16 place-items-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} strokeWidth="6" className="fill-none stroke-muted" />
        <circle
          cx="32"
          cy="32"
          r={r}
          strokeWidth="6"
          strokeLinecap="round"
          className="fill-none stroke-[url(#g)] transition-all"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#F5E1A4" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute font-display text-sm font-bold">{value}%</span>
    </div>
  );
}

function Suggestion({ done, label }: { done: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2 ${done ? "bg-success/5 text-success" : "bg-muted/60 text-muted-foreground"}`}
    >
      <span
        className={`grid h-5 w-5 place-items-center rounded-full ${done ? "bg-success text-white" : "bg-muted-foreground/20"}`}
      >
        {done ? <Check className="h-3 w-3" /> : <span className="text-[10px]">!</span>}
      </span>
      {label}
    </div>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-2 mt-6 flex items-end justify-between px-1">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
  desc,
  badge,
}: {
  to: string;
  icon: typeof ShieldCheck;
  label: string;
  desc: string;
  badge?: string;
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
        <p className="flex items-center gap-2 text-sm font-semibold">
          {label}
          {badge && (
            <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
              {badge}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  desc,
  on,
  onChange,
}: {
  icon: typeof ShieldCheck;
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:shadow-soft"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <span
        className={`grid h-6 w-11 items-center rounded-full p-0.5 transition ${on ? "bg-success" : "bg-muted"}`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition ${on ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}

function IconAction({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof ShieldCheck;
  label: string;
  tone?: "destructive";
}) {
  return (
    <button
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium ${
        tone === "destructive"
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-border bg-muted/40 text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
