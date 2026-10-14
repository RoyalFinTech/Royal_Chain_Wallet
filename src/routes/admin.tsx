import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { AlertTriangle, LockKeyhole } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/admin")({
  component: AdminRootLayout,
});

function AdminRootLayout() {
  const { location } = useRouterState();
  const isLoginPath = location.pathname === "/admin/login";

  // Admin pages were previously protected only by a client-side demo role
  // switch, and the login form accepted every credential. Do not expose
  // treasury/users/audit views until server-side authentication and RBAC exist.
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden gradient-royal px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
      <section className="relative w-full max-w-lg rounded-3xl border border-gold/20 bg-white/5 p-7 shadow-elegant backdrop-blur-xl sm:p-9">
        <div className="flex items-center gap-3">
          <Logo size={48} withText />
        </div>
        <div className="mt-7 grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
          {isLoginPath ? <LockKeyhole className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
        </div>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Restricted admin area</p>
        <h1 className="mt-2 font-display text-2xl font-bold">Admin access is not enabled</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          The current admin login and role selector are demo-only. They do not verify an administrator against a trusted server, and the dashboard figures are sample data. Admin and treasury pages are intentionally blocked until server-side authentication, role-based authorization, audit logging, and live data access are implemented.
        </p>
        <Link
          to="/"
          className="mt-6 grid h-12 w-full place-items-center rounded-2xl gradient-gold text-sm font-semibold text-navy shadow-glow"
        >
          Return to Royal Chain Wallet
        </Link>
      </section>
    </main>
  );
}
