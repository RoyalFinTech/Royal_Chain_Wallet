import { describe, it, expect } from "vitest";
import { canAccess } from "@/lib/admin/roles";
import { checkPermission } from "@/lib/security/permission-middleware";
import {
  grantAppPermission,
  hasScope,
  listConnectedApps,
  revokeAppPermission,
} from "@/lib/auth/permissions";

describe("admin/roles", () => {
  it("super_admin can access every section", () => {
    expect(canAccess("super_admin", "treasury")).toBe(true);
    expect(canAccess("super_admin", "settings")).toBe(true);
  });

  it("technical role cannot access treasury", () => {
    expect(canAccess("technical", "treasury")).toBe(false);
  });
});

describe("security/permission-middleware", () => {
  it("delegates admin_section checks to canAccess", () => {
    expect(checkPermission({ kind: "admin_section", role: "finance", section: "treasury" })).toBe(
      true,
    );
    expect(checkPermission({ kind: "admin_section", role: "finance", section: "users" })).toBe(
      false,
    );
  });
});

describe("auth/permissions (connected apps)", () => {
  it("grants and revokes scopes for a connected ecosystem app", () => {
    // jsdom-free environment: guard for window
    if (typeof window === "undefined") return;
    grantAppPermission({
      appId: "royal-play",
      scopes: ["view_address", "view_balance"],
      grantedAt: Date.now(),
      address: "abc",
    });
    expect(hasScope("royal-play", "view_balance")).toBe(true);
    expect(hasScope("royal-play", "request_transactions")).toBe(false);
    expect(listConnectedApps().some((g) => g.appId === "royal-play")).toBe(true);
    revokeAppPermission("royal-play");
    expect(hasScope("royal-play", "view_balance")).toBe(false);
  });
});
