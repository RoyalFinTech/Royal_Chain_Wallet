/**
 * Client-side Buffer polyfill for bitcoinjs-lib / @solana/web3.js and
 * other Node-Buffer-dependent crypto libraries.
 *
 * Loaded from a client-only module import that never touches SSR.
 */
import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  const g = globalThis as unknown as { Buffer?: typeof Buffer };
  if (!g.Buffer) g.Buffer = Buffer;
}

export {};
