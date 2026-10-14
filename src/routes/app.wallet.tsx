import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/app/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/app/currencies", replace: true });
  }, [navigate]);

  return (
    <div className="px-5 pb-10 pt-10">
      <Logo size={42} withText />
      <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-center">
        <Wallet className="mx-auto h-8 w-8 text-gold" />
        <h1 className="mt-3 font-display text-xl font-bold">Crypto assets</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Opening the multi-chain asset view. Legacy fiat wallet pockets and sample balances have been removed.
        </p>
        <Link to="/app/currencies" className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl gradient-gold px-5 text-sm font-semibold text-navy">
          View crypto assets <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/** Shared lightweight title/subtitle row imported by other app routes. */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header>
      <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
