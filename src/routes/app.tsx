import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/app/BottomNav";
import { AppFooter } from "@/components/app/AppFooter";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  // Page transitions come from the root <PageTransition> so every route
  // (auth, onboarding, /app/*) shares the exact same motion.
  return (
    <div className="relative min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-7xl pb-24">
        <Outlet />
        <AppFooter />
      </div>
      <BottomNav />
    </div>
  );
}
