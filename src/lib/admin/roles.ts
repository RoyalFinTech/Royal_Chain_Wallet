import { createContext, useContext } from "react";

/**
 * Admin role-based access, ready for a real auth/JWT claims check later.
 * For now the role is a client-side demo toggle (no backend yet) so every
 * admin screen can already be built against the permission surface.
 */
export type AdminRole = "super_admin" | "finance" | "compliance" | "technical";

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  finance: "Finance",
  compliance: "Compliance",
  technical: "Technical Admin",
};

export type AdminSection =
  | "dashboard"
  | "users"
  | "transactions"
  | "networks"
  | "token"
  | "treasury"
  | "analytics"
  | "security"
  | "fraud"
  | "system"
  | "audit"
  | "settings";

/** Which sections each role can see. Super Admin sees everything. */
const PERMISSIONS: Record<AdminRole, AdminSection[]> = {
  super_admin: [
    "dashboard",
    "users",
    "transactions",
    "networks",
    "token",
    "treasury",
    "analytics",
    "security",
    "fraud",
    "system",
    "audit",
    "settings",
  ],
  finance: ["dashboard", "transactions", "token", "treasury", "analytics", "audit"],
  compliance: ["dashboard", "users", "transactions", "security", "fraud", "audit"],
  technical: ["dashboard", "networks", "system", "audit", "settings"],
};

export function canAccess(role: AdminRole, section: AdminSection): boolean {
  return PERMISSIONS[role].includes(section);
}

interface AdminRoleContextValue {
  role: AdminRole;
  setRole: (r: AdminRole) => void;
}

export const AdminRoleContext = createContext<AdminRoleContextValue | null>(null);

export function useAdminRole(): AdminRoleContextValue {
  const ctx = useContext(AdminRoleContext);
  if (!ctx) throw new Error("useAdminRole must be used within AdminRoleContext.Provider");
  return ctx;
}
