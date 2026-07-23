import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Network,
  Coins,
  Landmark,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  Activity,
  ScrollText,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import {
  AdminRoleContext,
  useAdminRole,
  canAccess,
  ADMIN_ROLE_LABEL,
  type AdminRole,
  type AdminSection,
} from "@/lib/admin/roles";

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; section: AdminSection }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, section: "dashboard" },
  { to: "/admin/users", label: "Users", icon: Users, section: "users" },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt, section: "transactions" },
  { to: "/admin/networks", label: "Networks", icon: Network, section: "networks" },
  { to: "/admin/token", label: "ROY Token", icon: Coins, section: "token" },
  { to: "/admin/treasury", label: "Treasury", icon: Landmark, section: "treasury" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, section: "analytics" },
  { to: "/admin/security", label: "Security Monitoring", icon: ShieldCheck, section: "security" },
  { to: "/admin/fraud", label: "Fraud Detection", icon: ShieldAlert, section: "fraud" },
  { to: "/admin/system", label: "System Health", icon: Activity, section: "system" },
  { to: "/admin/audit", label: "Audit Logs", icon: ScrollText, section: "audit" },
  { to: "/admin/settings", label: "Settings", icon: Settings, section: "settings" },
];

/** Wraps every /admin/* page except /admin/login with the sidebar chrome. */
export function AdminShell({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AdminRole>("super_admin");
  return (
    <AdminRoleContext.Provider value={{ role, setRole }}>
      <AdminChrome>{children}</AdminChrome>
    </AdminRoleContext.Provider>
  );
}

function AdminChrome({ children }: { children: ReactNode }) {
  const { role, setRole } = useAdminRole();
  const { location } = useRouterState();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const visibleNav = NAV.filter((n) => canAccess(role, n.section));

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <Logo size={32} />
          <div>
            <p className="font-display text-sm font-bold">Royal Admin</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Control center
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {visibleNav.map(({ to, label, icon: Icon }) => {
            const active =
              location.pathname === to || (to !== "/admin" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                  active
                    ? "gradient-gold text-navy shadow-glow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            to="/admin/login"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-border bg-card px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Logo size={28} />
            <p className="font-display text-sm font-bold">Royal Admin</p>
          </div>
          <div className="hidden lg:block" />
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {ADMIN_ROLE_LABEL[role]}
              <ChevronDown className="h-3 w-3" />
            </button>
            {roleMenuOpen && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-2xl border border-border bg-card p-1.5 shadow-elegant">
                <p className="px-2.5 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Demo: switch role
                </p>
                {(Object.keys(ADMIN_ROLE_LABEL) as AdminRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setRoleMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs ${r === role ? "bg-gold/10 font-semibold text-gold" : "hover:bg-muted"}`}
                  >
                    {ADMIN_ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">{children}</main>

        {/* Mobile bottom nav (compact) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-border bg-card px-2 py-2 lg:hidden">
          {visibleNav.slice(0, 6).map(({ to, label, icon: Icon }) => {
            const active =
              location.pathname === to || (to !== "/admin" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[9px] font-medium ${active ? "text-gold" : "text-muted-foreground"}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/* ---------------------- Shared admin UI atoms ---------------------- */

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-border bg-card p-5 ${className}`}>{children}</div>
  );
}

export function StatTile({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend?: string;
  icon: typeof LayoutDashboard;
}) {
  const positive = trend?.startsWith("+");
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/10 text-gold">
          <Icon className="h-4 w-4" />
        </span>
        {trend && (
          <span className={`text-xs ${positive ? "text-success" : "text-destructive"}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-bold">{value}</p>
    </div>
  );
}

export function NoAccess({ section }: { section: string }) {
  return (
    <AdminCard className="mt-6 text-center">
      <p className="text-sm font-semibold">Restricted</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Your current role does not have access to {section}. Switch roles from the top-right menu to
        preview other views.
      </p>
    </AdminCard>
  );
}
