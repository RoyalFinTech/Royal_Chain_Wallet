/**
 * Permission framework (Module 4).
 *
 * Two layers:
 *  1. Connected-app scopes — what a third-party Ecosystem app (Royal Play,
 *     MarketLink, AMIS Properties) is allowed to see/do once "Connect
 *     Wallet" is pressed. Modeled after WalletConnect-style scopes.
 *  2. Recovery — formalizes the existing PIN/export-phrase flow (already
 *     implemented in src/lib/wallet) as a typed recovery-flow contract so
 *     a future social-recovery or 2FA-gated reset can slot in cleanly.
 */

export type AppPermissionScope =
  | "view_address" // read public address only
  | "view_balance" // read balances/portfolio
  | "request_transactions" // ask the wallet to sign & send
  | "view_activity"; // read transaction history

export interface ConnectedAppGrant {
  appId: string; // e.g. "royal-play", "marketlink", "amis-properties"
  scopes: AppPermissionScope[];
  grantedAt: number;
  address: string; // the address shared with the app
}

const STORAGE_KEY = "rcw.connected-apps";

function readGrants(): ConnectedAppGrant[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as ConnectedAppGrant[];
  } catch {
    return [];
  }
}

function writeGrants(grants: ConnectedAppGrant[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(grants));
  window.dispatchEvent(new CustomEvent("rcw:connected-apps-changed"));
}

export function grantAppPermission(grant: ConnectedAppGrant) {
  const existing = readGrants().filter((g) => g.appId !== grant.appId);
  writeGrants([...existing, grant]);
}

export function revokeAppPermission(appId: string) {
  writeGrants(readGrants().filter((g) => g.appId !== appId));
}

export function listConnectedApps(): ConnectedAppGrant[] {
  return readGrants();
}

export function hasScope(appId: string, scope: AppPermissionScope): boolean {
  return (
    readGrants()
      .find((g) => g.appId === appId)
      ?.scopes.includes(scope) ?? false
  );
}

/* ---------------------------- Recovery flow ---------------------------- */

export type RecoveryStep =
  "verify_identity" | "confirm_phrase_or_reset" | "set_new_pin" | "complete";

export interface RecoveryFlow {
  /** Step 1: prove ownership — today via existing PIN; later via 2FA/social recovery. */
  verifyIdentity(input: { pin?: string; mnemonic?: string }): Promise<boolean>;
  /** Step 2: set a new PIN once identity is verified. */
  resetPin(newPin: string): Promise<void>;
  currentStep(): RecoveryStep;
}
