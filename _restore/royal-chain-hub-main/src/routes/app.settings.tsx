import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Globe,
  Coins,
  MapPin,
  Clock,
  Palette,
  Bell,
  Fingerprint,
  ChevronRight,
  Check,
} from "lucide-react";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { CURRENCY_LIST, type CurrencyCode } from "@/lib/currencies";
import { usePreferredCurrency } from "@/lib/config/currency-preference";
import { useLocale } from "@/lib/i18n/provider";
import { listLocales } from "@/lib/i18n/config";
import { useState } from "react";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

const COUNTRIES = [
  { code: "GM", label: "🇬🇲 Gambia" },
  { code: "SN", label: "🇸🇳 Senegal" },
  { code: "NG", label: "🇳🇬 Nigeria" },
  { code: "GH", label: "🇬🇭 Ghana" },
  { code: "KE", label: "🇰🇪 Kenya" },
  { code: "US", label: "🇺🇸 United States" },
];
const THEMES: { id: "light" | "dark" | "system"; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

function SettingsPage() {
  const { locale, setLocale } = useLocale();
  const [currency, setCurrency] = usePreferredCurrency();
  const [country, setCountry] = useState("GM");
  const [tz, setTz] = useState("Africa/Banjul");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const locales = listLocales();

  return (
    <div className="px-5 pt-10 pb-6">
      <div className="flex items-center gap-3">
        <Link to="/app/profile" className="grid h-10 w-10 place-items-center rounded-full glass">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
      </div>

      <Section title="General">
        <SelectRow
          icon={Globe}
          label="Language"
          value={locales.find((l) => l.code === locale)?.nativeName ?? "English"}
          options={locales.map((l) => ({
            id: l.code,
            label: l.releaseReady ? l.nativeName : `${l.nativeName} (Coming Soon)`,
            disabled: !l.releaseReady,
          }))}
          selected={locale}
          onSelect={(v) => setLocale(v as typeof locale)}
        />
        <SelectRow
          icon={Coins}
          label="Currency"
          value={currency}
          options={CURRENCY_LIST.map((c) => ({
            id: c.code,
            label: `${c.flag} ${c.code} · ${c.name}`,
          }))}
          selected={currency}
          onSelect={(v) => setCurrency(v as CurrencyCode)}
        />
        <SelectRow
          icon={MapPin}
          label="Country"
          value={COUNTRIES.find((c) => c.code === country)?.label ?? ""}
          options={COUNTRIES.map((c) => ({ id: c.code, label: c.label }))}
          selected={country}
          onSelect={setCountry}
        />
        <SelectRow
          icon={Clock}
          label="Timezone"
          value={tz}
          options={[
            "Africa/Banjul",
            "Africa/Dakar",
            "Africa/Lagos",
            "Europe/London",
            "America/New_York",
          ].map((t) => ({ id: t, label: t }))}
          selected={tz}
          onSelect={setTz}
        />
      </Section>

      <Section title="Appearance">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
              <Palette className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Theme</p>
              <p className="text-xs text-muted-foreground">Choose how Royal Chain looks</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`rounded-2xl border p-3 text-xs font-semibold transition ${
                  theme === t.id
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Wallet">
        <NavRow
          to="/app/notifications"
          icon={Bell}
          label="Notifications"
          desc="Push, email, sounds"
        />
        <NavRow
          to="/app/security"
          icon={Fingerprint}
          label="Security"
          desc="PIN, 2FA, biometrics"
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function NavRow({
  to,
  icon: Icon,
  label,
  desc,
}: {
  to: string;
  icon: typeof Globe;
  label: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:shadow-soft"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
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

function SelectRow({
  icon: Icon,
  label,
  value,
  options,
  selected,
  onSelect,
}: {
  icon: typeof Globe;
  label: string;
  value: string;
  options: { id: string; label: string; disabled?: boolean }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{label}</p>
          <p className="truncate text-xs text-muted-foreground">{value}</p>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="max-h-56 overflow-auto border-t border-border p-2">
          {options.map((o) => (
            <button
              key={o.id}
              disabled={o.disabled}
              onClick={() => {
                if (o.disabled) return;
                onSelect(o.id);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                o.disabled
                  ? "cursor-not-allowed text-muted-foreground/50"
                  : selected === o.id
                    ? "bg-gold/10 text-gold"
                    : "hover:bg-muted/60"
              }`}
            >
              {o.label}
              {selected === o.id && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
