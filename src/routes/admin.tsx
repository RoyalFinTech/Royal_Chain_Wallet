import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  component: AdminRootLayout,
});

function AdminRootLayout() {
  const { location } = useRouterState();
  // The login screen renders its own full-bleed layout (no sidebar/role chrome).
  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
