/**
 * Secure storage + key management abstraction (Module 9).
 *
 * localStorage is the only persistence available in a plain web build.
 * This interface is the seam for a native shell (Claude Code / Cowork
 * wrapping this PWA, or a future Capacitor/React Native build) to swap in
 * OS-level secure storage (iOS Keychain / Android Keystore) without
 * touching any call site — everything in src/lib/wallet already reads
 * storage through a single localStorage surface, so pointing that at
 * this abstraction later is a one-file change.
 */

export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  readonly backend: "local_storage" | "keychain" | "keystore";
}

class WebLocalStorage implements SecureStorage {
  readonly backend = "local_storage" as const;
  async getItem(key: string): Promise<string | null> {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  }
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  }
  async removeItem(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  }
}

/**
 * Currently the only implementation. A native wrapper can register a
 * Keychain/Keystore-backed SecureStorage here at app startup — everything
 * downstream keeps working against the same interface.
 */
export const secureStorage: SecureStorage = new WebLocalStorage();

/**
 * Key management abstraction — today this is a no-op passthrough since
 * key material (the mnemonic) is encrypted with a PIN-derived key that's
 * never itself stored (see lib/security/encryption.ts). This interface
 * exists for a future hardware-backed key store (native Keychain "Secure
 * Enclave" key, or a hardware wallet bridge) to plug into without
 * changing the wallet creation/import/signing call sites.
 */
export interface KeyManager {
  readonly backend: "software" | "secure_enclave" | "hardware_wallet";
  isAvailable(): Promise<boolean>;
}

class SoftwareKeyManager implements KeyManager {
  readonly backend = "software" as const;
  async isAvailable(): Promise<boolean> {
    return true;
  }
}

export const keyManager: KeyManager = new SoftwareKeyManager();
