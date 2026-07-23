/**
 * Shared encryption primitives (Module 9).
 *
 * Extracted from src/lib/wallet/storage.ts so any future feature needing
 * PIN-derived AES-GCM encryption (e.g. encrypting cached KYC documents,
 * or a second wallet's mnemonic under multi-wallet support) reuses the
 * same audited primitive instead of re-implementing crypto.subtle calls.
 * wallet/storage.ts now imports from here — this is load-bearing, not
 * just a parallel abstraction.
 */

export interface Ciphertext {
  ciphertext: string; // base64
  iv: string; // base64
  salt: string; // base64
}

function bytesToB64(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
function b64ToBytes(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

type BS = BufferSource;

const PBKDF2_ITERATIONS = 200_000;

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase) as unknown as BS,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as unknown as BS, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypts a UTF-8 string under a passphrase (e.g. the user's PIN). */
export async function encryptString(plaintext: string, passphrase: string): Promise<Ciphertext> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plain = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as unknown as BS },
      key,
      plain as unknown as BS,
    ),
  );
  return { ciphertext: bytesToB64(ct), iv: bytesToB64(iv), salt: bytesToB64(salt) };
}

/** Decrypts a Ciphertext produced by encryptString. Throws on wrong passphrase. */
export async function decryptString(payload: Ciphertext, passphrase: string): Promise<string> {
  const key = await deriveKey(passphrase, b64ToBytes(payload.salt));
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(payload.iv) as unknown as BS },
    key,
    b64ToBytes(payload.ciphertext) as unknown as BS,
  );
  return new TextDecoder().decode(pt);
}

async function deriveBits(
  passphrase: string,
  salt: Uint8Array,
  lengthBits = 256,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase) as unknown as BS,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BS, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    lengthBits,
  );
  return new Uint8Array(bits);
}

/** One-way PIN hash for fast local verification WITHOUT decrypting the
 * mnemonic (e.g. app-unlock screen, rate-limit checks). This is separate
 * from the AES-GCM encryption above — encryption protects the mnemonic
 * at rest; this hash lets the UI check "is this the right PIN" cheaply.
 * Uses PBKDF2 as a KDF-based hash (SubtleCrypto has no direct bcrypt/
 * argon2 — acceptable for a client-side, rate-limited PIN check).
 */
export async function hashPin(
  pin: string,
  salt?: Uint8Array,
): Promise<{ hash: string; salt: string }> {
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(pin, saltBytes);
  return { hash: bytesToB64(bits), salt: bytesToB64(saltBytes) };
}

export async function verifyPinHash(pin: string, hash: string, salt: string): Promise<boolean> {
  const check = await hashPin(pin, b64ToBytes(salt));
  return check.hash === hash;
}

export { bytesToB64, b64ToBytes };
