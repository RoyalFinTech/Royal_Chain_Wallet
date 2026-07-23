import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "./app.wallet";
import {
  Receipt,
  Smartphone,
  Zap,
  Droplet,
  Tv,
  Wifi,
  GraduationCap,
  ShieldCheck,
  Send,
  Landmark,
  QrCode,
  Link2,
} from "lucide-react";

export const Route = createFileRoute("/app/payments")({
  component: Payments,
});

const bills = [
  { name: "Electricity", icon: Zap, color: "text-amber-500 bg-amber-500/10" },
  { name: "Water", icon: Droplet, color: "text-blue-500 bg-blue-500/10" },
  { name: "Cable TV", icon: Tv, color: "text-purple-500 bg-purple-500/10" },
  { name: "Internet", icon: Wifi, color: "text-teal-500 bg-teal-500/10" },
  { name: "Education", icon: GraduationCap, color: "text-rose-500 bg-rose-500/10" },
  { name: "Insurance", icon: ShieldCheck, color: "text-emerald-500 bg-emerald-500/10" },
];

const transfers = [
  { to: "/send", name: "Send Money", icon: Send },
  { to: "/qr", name: "QR Pay", icon: QrCode },
  { to: "/deposit", name: "Bank Transfer", icon: Landmark },
  { to: "/qr", name: "Daha Pay", icon: Link2 },
];

function Payments() {
  return (
    <div className="px-5 pt-10">
      <PageHeader title="Payments" subtitle="Move money, pay bills and top up." />

      <section className="mt-6">
        <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">Transfers</h2>
        <div className="grid grid-cols-2 gap-3">
          {transfers.map(({ to, name, icon: Icon }) => (
            <Link
              key={name}
              to={to}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-soft"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl gradient-gold text-navy">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold">{name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">
          Airtime & Data
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {["Africell", "QCell", "Gamcel", "Comium"].map((n) => (
            <button
              key={n}
              className="rounded-2xl border border-border bg-card px-2 py-3 text-xs font-medium hover:shadow-soft"
            >
              <Smartphone className="mx-auto mb-1 h-4 w-4 text-gold" />
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">Pay Bills</h2>
        <div className="grid grid-cols-3 gap-3">
          {bills.map(({ name, icon: Icon, color }) => (
            <button
              key={name}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 hover:shadow-soft"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-[11px] font-medium">{name}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl gradient-royal p-5 text-white shadow-elegant">
        <div className="flex items-start gap-3">
          <Receipt className="mt-1 h-6 w-6 text-gold" />
          <div>
            <p className="font-display text-lg font-bold">Save more with Daha Pay</p>
            <p className="mt-1 text-xs text-white/70">
              Get up to 3% cashback on all bill payments made this month.
            </p>
            <button className="mt-3 rounded-full gradient-gold px-4 py-1.5 text-xs font-semibold text-navy">
              Learn more
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
