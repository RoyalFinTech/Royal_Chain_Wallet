import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Ban, CheckCircle2, Eye } from "lucide-react";
import { AdminPageHeader, AdminCard, StatTile, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";

export const Route = createFileRoute("/admin/fraud")({
  component: AdminFraud,
});

interface FraudCase {
  id: string;
  user: string;
  reason: string;
  amountUsd: number;
  severity: "low" | "medium" | "high";
  status: "open" | "reviewing" | "resolved";
}

const cases: FraudCase[] = [
  {
    id: "fc_2201",
    user: "usr_1009",
    reason: "Rapid multi-chain fan-out to new addresses",
    amountUsd: 18400,
    severity: "high",
    status: "open",
  },
  {
    id: "fc_2198",
    user: "usr_1042",
    reason: "Deposit velocity anomaly",
    amountUsd: 4200,
    severity: "medium",
    status: "reviewing",
  },
  {
    id: "fc_2189",
    user: "usr_1003",
    reason: "Address on sanctions watchlist (false positive)",
    amountUsd: 900,
    severity: "low",
    status: "resolved",
  },
  {
    id: "fc_2177",
    user: "usr_1077",
    reason: "Device/IP mismatch on large withdrawal",
    amountUsd: 26900,
    severity: "high",
    status: "reviewing",
  },
];

const SEVERITY_COLOR = {
  low: "text-success bg-success/10",
  medium: "text-amber-600 bg-amber-500/10",
  high: "text-destructive bg-destructive/10",
};

const STATUS_ICON = { open: AlertTriangle, reviewing: Eye, resolved: CheckCircle2 };

function AdminFraud() {
  const { role } = useAdminRole();
  if (!canAccess(role, "fraud")) return <NoAccess section="Fraud Detection" />;

  return (
    <div>
      <AdminPageHeader
        title="Fraud Detection"
        subtitle="Automated risk scoring across every chain"
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatTile label="Open Cases" value="1" icon={AlertTriangle} />
        <StatTile label="Under Review" value="2" icon={Eye} />
        <StatTile label="Blocked (30d)" value="$142,900" icon={Ban} trend="+11.2%" />
      </div>

      <AdminCard className="mt-6">
        <h2 className="font-display text-base font-bold">Flagged Cases</h2>
        <div className="mt-4 space-y-2">
          {cases.map((c) => {
            const StatusIcon = STATUS_ICON[c.status];
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.id} · {c.user} · ${c.amountUsd.toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${SEVERITY_COLOR[c.severity]}`}
                  >
                    {c.severity}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs capitalize text-muted-foreground">
                    <StatusIcon className="h-3.5 w-3.5" /> {c.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>
    </div>
  );
}
