import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, AlertTriangle, Server, Database, Zap } from "lucide-react";
import { AdminPageHeader, AdminCard, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";

export const Route = createFileRoute("/admin/system")({
  component: AdminSystem,
});

const services = [
  { name: "Authentication API", status: "operational", latencyMs: 84 },
  { name: "Wallet API", status: "operational", latencyMs: 112 },
  { name: "Transaction API", status: "operational", latencyMs: 96 },
  { name: "Token API", status: "operational", latencyMs: 74 },
  { name: "Notification API", status: "degraded", latencyMs: 410 },
  { name: "Admin API", status: "operational", latencyMs: 61 },
  { name: "Bitcoin Service", status: "operational", latencyMs: 188 },
  { name: "Ethereum Service", status: "operational", latencyMs: 142 },
  { name: "BNB Chain Service", status: "operational", latencyMs: 130 },
  { name: "Solana Service", status: "operational", latencyMs: 58 },
] as const;

function AdminSystem() {
  const { role } = useAdminRole();
  if (!canAccess(role, "system")) return <NoAccess section="System Health" />;

  const degraded = services.filter((s) => s.status !== "operational").length;

  return (
    <div>
      <AdminPageHeader
        title="System Health"
        subtitle="Uptime and latency across every backend service"
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <AdminCard>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/10 text-gold">
            <Server className="h-4 w-4" />
          </span>
          <p className="mt-3 text-xs text-muted-foreground">Uptime (30d)</p>
          <p className="font-display text-xl font-bold">99.97%</p>
        </AdminCard>
        <AdminCard>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/10 text-gold">
            <Zap className="h-4 w-4" />
          </span>
          <p className="mt-3 text-xs text-muted-foreground">Avg. response time</p>
          <p className="font-display text-xl font-bold">106ms</p>
        </AdminCard>
        <AdminCard>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/10 text-gold">
            <Database className="h-4 w-4" />
          </span>
          <p className="mt-3 text-xs text-muted-foreground">DB connections</p>
          <p className="font-display text-xl font-bold">42 / 200</p>
        </AdminCard>
      </div>

      <AdminCard className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Backend Services</h2>
          {degraded > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-600">
              <AlertTriangle className="h-3 w-3" /> {degraded} degraded
            </span>
          )}
        </div>
        <div className="mt-4 space-y-2">
          {services.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between rounded-2xl border border-border p-3"
            >
              <div className="flex items-center gap-2">
                {s.status === "operational" ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                <p className="text-sm font-medium">{s.name}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">{s.latencyMs}ms</span>
                <span
                  className={`rounded-full px-2 py-1 font-semibold capitalize ${s.status === "operational" ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-600"}`}
                >
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
