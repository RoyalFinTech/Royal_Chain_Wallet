import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { AdminPageHeader, AdminCard, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type UserStatus = "verified" | "pending" | "flagged";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  chains: string[];
  volumeUsd: number;
  status: UserStatus;
  joined: string;
}

function mockUsers(): AdminUser[] {
  const names = [
    "Fatou Jallow",
    "Momodou Ceesay",
    "Awa Bojang",
    "Lamin Sanneh",
    "Isatou Njie",
    "Ebrima Touray",
    "Mariama Sow",
    "Alieu Darboe",
    "Binta Camara",
    "Ousman Bah",
  ];
  const chainsPool = [
    ["BTC", "SOL"],
    ["ETH", "ROY"],
    ["SOL", "USDT"],
    ["BNB"],
    ["BTC", "ETH", "SOL"],
  ];
  return names.map((n, i) => ({
    id: `usr_${1000 + i}`,
    name: n,
    email: `${n.toLowerCase().replace(" ", ".")}@example.com`,
    chains: chainsPool[i % chainsPool.length],
    volumeUsd: Math.round(400 + ((i * 3721) % 9000)),
    status: i % 9 === 0 ? "flagged" : i % 4 === 0 ? "pending" : "verified",
    joined: `2026-0${(i % 6) + 1}-1${i}`,
  }));
}

const STATUS_META: Record<
  UserStatus,
  { label: string; icon: typeof ShieldCheck; className: string }
> = {
  verified: { label: "Verified", icon: ShieldCheck, className: "text-success bg-success/10" },
  pending: { label: "Pending KYC", icon: ShieldAlert, className: "text-amber-600 bg-amber-500/10" },
  flagged: { label: "Flagged", icon: ShieldX, className: "text-destructive bg-destructive/10" },
};

function AdminUsers() {
  const { role } = useAdminRole();
  const [query, setQuery] = useState("");
  const users = useMemo(mockUsers, []);
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) || u.email.includes(query.toLowerCase()),
  );

  if (!canAccess(role, "users")) return <NoAccess section="Users" />;

  return (
    <div>
      <AdminPageHeader
        title="Users"
        subtitle={`${users.length.toLocaleString()} registered wallet holders`}
      />

      <AdminCard className="mt-6">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-input/40 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-2 font-medium">User</th>
                <th className="py-2 font-medium">Chains</th>
                <th className="py-2 font-medium">Volume</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const meta = STATUS_META[u.status];
                const Icon = meta.icon;
                return (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-3 text-xs">{u.chains.join(", ")}</td>
                    <td className="py-3 text-xs font-medium">${u.volumeUsd.toLocaleString()}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${meta.className}`}
                      >
                        <Icon className="h-3 w-3" /> {meta.label}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{u.joined}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
