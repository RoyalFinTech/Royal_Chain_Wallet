import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, Mail, Zap, ShieldAlert, Megaphone, Volume2, Vibrate } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  // These are local UI preferences only; delivery and persistence are not implemented.
  const [prefs, setPrefs] = useState({
    push: false,
    email: false,
    txn: false,
    security: false,
    marketing: false,
    sound: false,
    vibration: false,
  });
  const set = <K extends keyof typeof prefs>(k: K, v: boolean) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <div className="px-5 pt-10 pb-6">
      <div className="flex items-center gap-3">
        <Link to="/app/profile" className="grid h-10 w-10 place-items-center rounded-full glass">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold">Notifications</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Choose what you want to hear about.</p>
      <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-5 text-muted-foreground">
        These switches currently change local preview state only. Preferences are not saved between
        visits, and push notifications, email delivery, transaction alerts, and device feedback are
        not connected in this build.
      </div>

      <Group title="Channels">
        <Toggle
          icon={Bell}
          label="Push notifications"
          desc="Alerts on this device"
          on={prefs.push}
          onChange={(v) => set("push", v)}
        />
        <Toggle
          icon={Mail}
          label="Email notifications"
          desc="Receipts & summaries"
          on={prefs.email}
          onChange={(v) => set("email", v)}
        />
      </Group>

      <Group title="What to notify">
        <Toggle
          icon={Zap}
          label="Transaction alerts"
          desc="Every send, receive & payment"
          on={prefs.txn}
          onChange={(v) => set("txn", v)}
        />
        <Toggle
          icon={ShieldAlert}
          label="Security alerts"
          desc="Logins, PIN changes, 2FA events"
          on={prefs.security}
          onChange={(v) => set("security", v)}
        />
        <Toggle
          icon={Megaphone}
          label="Product & offers"
          desc="Occasional updates from Royal Chain"
          on={prefs.marketing}
          onChange={(v) => set("marketing", v)}
        />
      </Group>

      <Group title="Feedback">
        <Toggle
          icon={Volume2}
          label="Sound"
          desc="Play alert sound"
          on={prefs.sound}
          onChange={(v) => set("sound", v)}
        />
        <Toggle
          icon={Vibrate}
          label="Vibration"
          desc="Haptic feedback"
          on={prefs.vibration}
          onChange={(v) => set("vibration", v)}
        />
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Toggle({
  icon: Icon,
  label,
  desc,
  on,
  onChange,
}: {
  icon: import("lucide-react").LucideIcon;
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
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
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
