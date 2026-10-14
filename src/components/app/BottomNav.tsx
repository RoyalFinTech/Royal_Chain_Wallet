import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Repeat, Receipt, User } from "lucide-react";

const items = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/currencies", label: "Crypto", icon: Wallet },
  { to: "/app/swap", label: "Swap", icon: Repeat },
  { to: "/app/transactions", label: "History", icon: Receipt },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="glass rounded-3xl px-2 py-2 shadow-elegant">
          <ul className="flex items-center justify-between">
            {items.map(({ to, label, icon: Icon }) => {
              const active =
                location.pathname === to || (to !== "/app" && location.pathname.startsWith(to));
              return (
                <li key={to} className="flex-1">
                  <Link
                    to={to}
                    className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition ${
                      active
                        ? "gradient-gold text-navy shadow-glow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
