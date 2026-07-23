/**
 * Client-side encrypted wallet storage.
 *
 * Non-custodial: the mnemonic never leaves the device and is never sent to
 * any backend. It is encrypted with a key derived from the user's PIN
 * (PBKDF2-SHA256, 200k iterations) using AES-GCM, then persisted in
 * localStorage. Only derived public addresses are ever read by the UI
 * without unlocking.
 *
 * Browser-only. Do not import from server code.
 */
import { deriveAllChains, type DerivedAddresses } from "./derive";
import { encryptString, decryptString, type Ciphertext } from "@/lib/security/encryption";

const STORAGE_KEY = "rcw.wallet.v2";

export interface StoredWallet {
  version: 2;
  addresses: DerivedAddresses;
  createdAt: string;
  // Encrypted mnemonic
  ciphertext: string; // base64
  iv: string; // base64
  salt: string; // base64
  wordCount: 12 | 24;
}

/* ----------------------- Crypto (delegates to lib/security/encryption) --- */

async function encryptMnemonic(mnemonic: string, pin: string): Promise<Ciphertext> {
  return encryptString(mnemonic, pin);
}

async function decryptMnemonic(w: StoredWallet, pin: string): Promise<string> {
  try {
    return (await decryptString({ ciphertext: w.ciphertext, iv: w.iv, salt: w.salt }, pin)).trim();
  } catch {
    throw new Error("Incorrect PIN.");
  }
}

/* ----------------------- Public wallet ops ------------------------- */

/**
 * Encrypt & persist a mnemonic (already derived) under a PIN.
 */
export async function encryptAndSave(
  mnemonic: string,
  pin: string,
  wordCount: 12 | 24,
): Promise<StoredWallet> {
  const words = mnemonic.trim().split(/\s+/);
  const addresses = await deriveAllChains(mnemonic.trim());
  const enc = await encryptMnemonic(mnemonic.trim(), pin);
  const stored: StoredWallet = {
    version: 2,
    addresses,
    createdAt: new Date().toISOString(),
    wordCount: (words.length === 24 ? 24 : 12) as 12 | 24,
    ...enc,
  };
  void wordCount;
  saveWallet(stored);
  return stored;
}

/**
 * Unlock: decrypt the stored mnemonic with the PIN, verify addresses match.
 */
export async function unlockWallet(
  stored: StoredWallet,
  pin: string,
): Promise<{ mnemonic: string; addresses: DerivedAddresses }> {
  let mnemonic: string;
  try {
    mnemonic = await decryptMnemonic(stored, pin);
  } catch {
    throw new Error("Incorrect PIN.");
  }
  const addresses = await deriveAllChains(mnemonic);
  if (addresses.solana.address !== stored.addresses.solana.address) {
    throw new Error("Wallet integrity check failed.");
  }
  return { mnemonic, addresses };
}

/**
 * Change PIN: decrypt with old PIN, re-encrypt mnemonic with new PIN.
 */
export async function changePin(
  stored: StoredWallet,
  oldPin: string,
  newPin: string,
): Promise<StoredWallet> {
  const { mnemonic } = await unlockWallet(stored, oldPin);
  const enc = await encryptMnemonic(mnemonic, newPin);
  const updated: StoredWallet = { ...stored, ...enc };
  saveWallet(updated);
  return updated;
}

/**
 * Export mnemonic after re-authenticating with PIN.
 * Caller is responsible for immediately clearing from memory / UI.
 */
export async function exportMnemonic(stored: StoredWallet, pin: string): Promise<string> {
  const { mnemonic } = await unlockWallet(stored, pin);
  return mnemonic;
}

/* ---------------------- Persistent storage ---------------------- */

export function loadWallet(): StoredWallet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWallet;
    return parsed.version === 2 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveWallet(w: StoredWallet) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
  window.dispatchEvent(new CustomEvent("rcw:wallet-changed"));
}

export function clearWallet() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("rcw:wallet-changed"));
}

/* ---------------------- Formatting helpers ---------------------- */

export function shortenAddress(a: string, front = 4, back = 4): string {
  return a.length > front + back + 3 ? `${a.slice(0, front)}…${a.slice(-back)}` : a;
}
