import { createFileRoute } from "@tanstack/react-router";
import { Database, ShieldAlert } from "lucide-react";
import { AdminPageHeader, AdminCard, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";

export const Route = createFileRoute("/admin/transactions")({
  component: AdminTransactions,
});

function AdminTransactions() {
  const { role } = useAdminRole();

  if (!canAccess(role, "transactions")) return <NoAccess section="Transactions" />;

  return (
    <div>
      <AdminPageHeader
        title="Transactions"
        subtitle="Verified platform activity is not connected"
      />
      <AdminCard className="mt-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold">No verified transaction feed</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This build does not have a trusted chain indexer or verified server-side transaction
              feed for the admin console. No generated hashes, sample transfers, synthetic user
              activity, or estimated platform totals are displayed here.
            </p>
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-700">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Administrative access remains blocked until server-side authentication, role checks,
              audit logging, and live transaction verification are implemented and reviewed.
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
