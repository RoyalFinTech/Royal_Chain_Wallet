import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { NetworkGrid } from "@/components/brand/FxEffects";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Decorative header */}
      <div className="relative overflow-hidden gradient-royal pb-24 pt-8 text-white">
        <NetworkGrid />
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
        <header className="relative mx-auto flex w-full max-w-md items-center justify-between px-6">
          <Link to="/onboarding" aria-label="Home">
            <Logo size={40} />
          </Link>
          <ThemeToggle />
        </header>
      </div>

      <main className="relative mx-auto -mt-16 w-full max-w-md flex-1 px-4 pb-10">
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-elegant sm:p-8">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Protected by Royal FinTech Secure Layer™
        </p>
      </main>
    </div>
  );
}
