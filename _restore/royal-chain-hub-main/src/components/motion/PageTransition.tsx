import { type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Standardized page transition. Re-mounts children on pathname change
 * and plays a subtle fade + rise using tokens from `src/lib/motion.ts`.
 *
 * Wrap layout <Outlet /> instances with this to guarantee consistent
 * transitions on every route.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div key={pathname} className="motion-page-enter">
      {children}
    </div>
  );
}
