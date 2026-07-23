import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AdminPageHeader, AdminCard, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess, ADMIN_ROLE_LABEL, type AdminRole } from "@/lib/admin/roles";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Full access to every section, including role management and treasury controls.",
  finance: "Transactions, ROY token management, treasury, and analytics.",
  compliance: "Users, transactions, security monitoring, fraud detection, and audit logs.",
  technical: "Networks, system health, audit logs, and platform settings.",
};

function AdminSettings() {
  const { role } = useAdminRole();
  if (!canAccess(role, "settings")) return <NoAccess section="Settings" />;

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        subtitle="Admin roles, platform configuration, and API keys"
      />

      <AdminCard className="mt-6">
        <h2 className="font-display text-base font-bold">Admin Roles</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Role-based access is enforced across every admin screen. Switch roles from the top-right
          menu to preview.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.keys(ADMIN_ROLE_LABEL) as AdminRole[]).map((r) => (
            <div
              key={r}
              className={`rounded-2xl border p-4 ${r === role ? "border-gold bg-gold/5" : "border-border"}`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`h-4 w-4 ${r === role ? "text-gold" : "text-muted-foreground"}`}
                />
                <p className="text-sm font-semibold">{ADMIN_ROLE_LABEL[r]}</p>
                {r === role && (
                  <span className="ml-auto rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</p>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="mt-4">
        <h2 className="font-display text-base font-bold">Platform Configuration</h2>
        <div className="mt-4 space-y-3">
          {[
            { label: "Bitcoin RPC endpoint", env: "VITE_BTC_API_URL" },
            { label: "Ethereum RPC endpoint", env: "VITE_ETH_RPC_URL" },
            { label: "BNB Chain RPC endpoint", env: "VITE_BNB_RPC_URL" },
            { label: "Solana RPC endpoint", env: "VITE_SOL_RPC_URL" },
            { label: "ROY token mint address", env: "VITE_ROY_MINT" },
          ].map((f) => (
            <label key={f.env} className="block">
              <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
              <input
                disabled
                placeholder={`Set via ${f.env} (not configured)`}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-xs text-muted-foreground"
              />
            </label>
          ))}
          <p className="text-[11px] text-muted-foreground">
            Endpoints are environment-configured and never hardcoded. Update these in your
            deployment's environment variables, not in application code.
          </p>
        </div>
      </AdminCard>
    </div>
  );
}
