import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/legal")({
  component: LegalLayout,
});

function LegalLayout() {
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
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
