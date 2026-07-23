import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Smartphone, KeyRound, Globe } from "lucide-react";
import { AdminPageHeader, AdminCard, StatTile, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";

export const Route = createFileRoute("/admin/security")({
  component: AdminSecurity,
});

interface SecurityEvent {
  who: string;
  what: string;
  where: string;
  where2?: string;
  when: string;
  risk: "low" | "medium" | "high";
}

const events: SecurityEvent[] = [
  {
    who: "admin@royalchain.com",
    what: "Signed in",
    where: "Banjul, GM",
    when: "2 min ago",
    risk: "low",
  },
  {
    who: "finance@royalchain.com",
    what: "Approved treasury withdrawal",
    where: "Banjul, GM",
    when: "41 min ago",
    risk: "low",
  },
  {
    who: "unknown",
    what: "Failed 2FA attempt (3x)",
    where: "Unrecognized IP",
    where2: "Lagos, NG",
    when: "2 hrs ago",
    risk: "high",
  },
  {
    who: "compliance@royalchain.com",
    what: "Reviewed flagged user usr_1009",
    where: "Banjul, GM",
    when: "5 hrs ago",
    risk: "low",
  },
  {
    who: "unknown",
    what: "Password reset requested",
    where: "Unrecognized device",
    when: "1 day ago",
    risk: "medium",
  },
];

const RISK_COLOR = {
  low: "text-success bg-success/10",
  medium: "text-amber-600 bg-amber-500/10",
  high: "text-destructive bg-destructive/10",
};

function AdminSecurity() {
  const { role } = useAdminRole();
  if (!canAccess(role, "security")) return <NoAccess section="Security Monitoring" />;

  return (
    <div>
      <AdminPageHeader
        title="Security Monitoring"
        subtitle="Access, sessions, and anomaly detection"
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Admins with 2FA" value="100%" icon={ShieldCheck} />
        <StatTile label="Active Sessions" value="7" icon={Smartphone} />
        <StatTile label="Failed Logins (24h)" value="14" trend="-6" icon={KeyRound} />
        <StatTile label="Unrecognized IPs (24h)" value="3" icon={Globe} />
      </div>

      <AdminCard className="mt-6">
        <h2 className="font-display text-base font-bold">Recent Security Events</h2>
        <div className="mt-4 space-y-2">
          {events.map((e, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.what}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.who} · {e.where}
                  {e.where2 ? `, ${e.where2}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${RISK_COLOR[e.risk]}`}
                >
                  {e.risk} risk
                </span>
                <p className="mt-1 text-[10px] text-muted-foreground">{e.when}</p>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
