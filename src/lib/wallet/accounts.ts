/**
 * Multi-wallet account management (Module 5).
 *
 * Additive on top of the existing single-wallet storage in
 * src/lib/wallet/storage.ts (unchanged, still the "active wallet" used by
 * every existing screen — no UI changes in this phase). This layer adds
 * the capability to track multiple wallets side by side and switch which
 * one is active, ready for a future "Add Wallet" / wallet-switcher UI
 * without any storage migration required later.
 */
import type { StoredWallet } from "./storage";

const REGISTRY_KEY = "rcw.wallet-registry.v1";
const ACTIVE_WALLET_KEY = "rcw.active-wallet-id";
const LEGACY_SINGLE_WALLET_KEY = "rcw.wallet.v2"; // matches STORAGE_KEY in storage.ts

export interface WalletRegistryEntry {
  id: string;
  label: string;
  primaryAddress: string; // Solana address, used as a stable display id
  createdAt: string;
}

function readRegistry(): WalletRegistryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(REGISTRY_KEY) ?? "[]") as WalletRegistryEntry[];
  } catch {
    return [];
  }
}

function writeRegistry(entries: WalletRegistryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent("rcw:wallet-registry-changed"));
}

/**
 * Ensures the legacy single-wallet (if present) is represented in the
 * registry, so existing users transparently gain multi-wallet capability
 * the first time this is called — no explicit migration step needed.
 */
export function ensureRegistrySeeded(activeWallet: StoredWallet | null) {
  if (!activeWallet) return;
  const registry = readRegistry();
  if (registry.some((e) => e.primaryAddress === activeWallet.addresses.solana.address)) return;
  const entry: WalletRegistryEntry = {
    id: activeWallet.addresses.solana.address,
    label: "Main Wallet",
    primaryAddress: activeWallet.addresses.solana.address,
    createdAt: activeWallet.createdAt,
  };
  writeRegistry([...registry, entry]);
  if (!getActiveWalletId()) setActiveWalletId(entry.id);
}

export function listWalletRegistry(): WalletRegistryEntry[] {
  return readRegistry();
}

export function getActiveWalletId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_WALLET_KEY);
}

export function setActiveWalletId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_WALLET_KEY, id);
  window.dispatchEvent(new CustomEvent("rcw:active-wallet-changed"));
}

export function renameWallet(id: string, label: string) {
  writeRegistry(readRegistry().map((e) => (e.id === id ? { ...e, label } : e)));
}

/**
 * NOTE: today every wallet in the registry maps to the same encrypted
 * blob under LEGACY_SINGLE_WALLET_KEY, since only one wallet can actually
 * be created/imported through the existing UI. Storing N independent
 * encrypted wallets (one per registry entry) is the next step once an
 * "Add Wallet" flow is designed — this file intentionally stops at the
 * registry/switching layer so that UI work stays out of Phase 8A.
 */
export { LEGACY_SINGLE_WALLET_KEY };
