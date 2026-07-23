/**
 * Royal Chain Wallet — non-custodial multi-chain wallet engine.
 *
 * One BIP-39 recovery phrase derives an address on every supported chain
 * (Bitcoin, Ethereum, BNB Chain, Solana). The mnemonic and private keys
 * never leave the device and are never sent to any backend — only PIN-
 * encrypted ciphertext is persisted in localStorage.
 *
 * Browser-only. Do not import from server code.
 */
export type { ChainId, ChainAddress, DerivedAddresses } from "./derive";
export { generateMnemonic, validateMnemonic } from "./derive";
export type { StoredWallet } from "./storage";
export {
  loadWallet,
  saveWallet,
  clearWallet,
  unlockWallet,
  changePin,
  exportMnemonic,
  shortenAddress,
} from "./storage";

import { generateMnemonic, validateMnemonic } from "./derive";
import { encryptAndSave, type StoredWallet } from "./storage";

/**
 * Generate a fresh 12-word recovery phrase, derive every chain address,
 * encrypt with the PIN, and persist.
 */
export async function createWallet(pin: string): Promise<{
  stored: StoredWallet;
  mnemonic: string;
}> {
  const mnemonic = generateMnemonic(128); // 12 words
  const stored = await encryptAndSave(mnemonic, pin, 12);
  return { stored, mnemonic };
}

/**
 * Import an existing 12- or 24-word BIP-39 mnemonic (compatible with
 * Phantom, Trust Wallet, MetaMask, and Solflare recovery phrases).
 */
export async function importWallet(mnemonic: string, pin: string): Promise<StoredWallet> {
  const normalized = mnemonic.trim().toLowerCase().split(/\s+/).join(" ");
  const words = normalized.split(" ").filter(Boolean);
  if (words.length !== 12 && words.length !== 24) {
    throw new Error("Recovery phrase must be 12 or 24 words.");
  }
  if (!validateMnemonic(normalized)) {
    throw new Error("Recovery phrase is not a valid BIP-39 mnemonic.");
  }
  return encryptAndSave(normalized, pin, words.length as 12 | 24);
}
