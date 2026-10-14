import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Globe, Coins, Palette, Check, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { CURRENCY_LIST, type CurrencyCode } from "@/lib/currencies";
import { usePreferredCurrency } from "@/lib/config/currency-preference";
import { useLocale } from "@/lib/i18n/provider";
import { listLocales } from "@/lib/i18n/config";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { locale, setLocale } = useLocale();
  const [currency, setCurrency] = usePreferredCurrency();
  const locales = listLocales();

  return (
    <div className="px-5 pb-8 pt-10">
      <header className="flex items-center gap-3">
        <Link to="/app/profile" aria-label="Back to wallet profile" className="grid h-10 w-10 place-items-center rounded-full glass">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">Settings</h1>
          <p className="text-xs text-muted-foreground">Royal Chain Wallet preferences</p>
        </div>
        <Logo size={34} />
      </header>

      <section className="mt-6">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">General</h2>
        <div className="space-y-2">
          <SelectRow
            icon={Globe}
            label="Language"
            value={locales.find((item) => item.code === locale)?.nativeName ?? "English"}
            options={locales.map((item) => ({
              id: item.code,
              label: item.releaseReady ? item.nativeName : `${item.nativeName} (Coming soon)`,
              disabled: !item.releaseReady,
            }))}
            selected={locale}
            onSelect={(value) => setLocale(value as typeof locale)}
          />
          <SelectRow
            icon={Coins}
            label="Display currency"
            value={currency}
            options={CURRENCY_LIST.map((item) => ({
              id: item.code,
              label: `${item.flag} ${item.code} · ${item.name}`,
            }))}
            selected={currency}
            onSelect={(value) => setCurrency(value as CurrencyCode)}
          />
        </div>
        <p className="mt-2 px-1 text-[11px] leading-5 text-muted-foreground">
          Display currency affects estimated fiat value only; it does not create a fiat account or change your on-chain crypto balance. Exchange rates are sample values until a live price source is connected.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Appearance</h2>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
            <Palette className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Theme</p>
            <p className="text-xs text-muted-foreground">Switch between light and dark appearance</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Wallet</h2>
        <div className="space-y-2">
          <Link to="/app/notifications" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/10 text-gold"><Check className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Notification preferences</span><span className="text-xs text-muted-foreground">Local preview; delivery is not connected</span></span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/app/security" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/10 text-gold"><Coins className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Wallet security</span><span className="text-xs text-muted-foreground">Local PIN and recovery phrase</span></span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </section>
    </div>
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
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{label}</p>
          <p className="truncate text-xs text-muted-foreground">{value}</p>
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="max-h-56 overflow-auto border-t border-border p-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={option.disabled}
              onClick={() => {
                if (option.disabled) return;
                onSelect(option.id);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${option.disabled ? "cursor-not-allowed text-muted-foreground/50" : selected === option.id ? "bg-gold/10 text-gold" : "hover:bg-muted/60"}`}
            >
              {option.label}
              {selected === option.id && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
