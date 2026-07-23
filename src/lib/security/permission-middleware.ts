/**
 * Permission middleware (Module 9).
 *
 * A single choke point for "is this action allowed" checks, wrapping the
 * two existing permission systems (admin RBAC in lib/admin/roles.ts, and
 * connected-app scopes in lib/auth/permissions.ts) behind one call so
 * route/service code doesn't need to know which system applies.
 */
import { canAccess, type AdminRole, type AdminSection } from "@/lib/admin/roles";
import { hasScope, type AppPermissionScope } from "@/lib/auth/permissions";
import { AppError } from "@/lib/errors/types";

export type PermissionCheck =
  | { kind: "admin_section"; role: AdminRole; section: AdminSection }
  | { kind: "app_scope"; appId: string; scope: AppPermissionScope };

export function checkPermission(check: PermissionCheck): boolean {
  switch (check.kind) {
    case "admin_section":
      return canAccess(check.role, check.section);
    case "app_scope":
      return hasScope(check.appId, check.scope);
  }
}

/** Throws AppError("forbidden") if the check fails — use at the top of a guarded action. */
export function assertPermission(
  check: PermissionCheck,
  message = "You do not have permission to do this.",
) {
  if (!checkPermission(check)) {
    throw new AppError("forbidden", message);
  }
}
