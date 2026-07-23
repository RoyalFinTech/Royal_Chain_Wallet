import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { AdminPageHeader, AdminCard, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAudit,
});

const log = [
  {
    actor: "admin@royalchain.com",
    action: "Updated network fee threshold for Solana",
    target: "networks.solana",
    when: "2026-07-17 09:12",
  },
  {
    actor: "finance@royalchain.com",
    action: "Approved treasury withdrawal of $12,400",
    target: "treasury.withdraw",
    when: "2026-07-17 08:41",
  },
  {
    actor: "compliance@royalchain.com",
    action: "Marked user usr_1009 as flagged",
    target: "users.usr_1009",
    when: "2026-07-16 17:03",
  },
  {
    actor: "technical@royalchain.com",
    action: "Restarted Notification API service",
    target: "system.notification-api",
    when: "2026-07-16 14:22",
  },
  {
    actor: "admin@royalchain.com",
    action: "Changed role permissions for Compliance",
    target: "roles.compliance",
    when: "2026-07-15 11:05",
  },
  {
    actor: "finance@royalchain.com",
    action: "Minted 50,000 ROY to rewards pool",
    target: "token.roy",
    when: "2026-07-14 16:48",
  },
];

function AdminAudit() {
  const { role } = useAdminRole();
  if (!canAccess(role, "audit")) return <NoAccess section="Audit Logs" />;

  return (
    <div>
      <AdminPageHeader
        title="Audit Logs"
        subtitle="Every privileged action, permanently recorded"
      />

      <AdminCard className="mt-6">
        <div className="space-y-0">
          {log.map((entry, i) => (
            <div
              key={i}
              className="flex items-start gap-3 border-b border-border/60 py-3 last:border-0"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                <ScrollText className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{entry.action}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {entry.actor} · <span className="font-mono">{entry.target}</span>
                </p>
              </div>
              <p className="shrink-0 text-[10px] text-muted-foreground">{entry.when}</p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
