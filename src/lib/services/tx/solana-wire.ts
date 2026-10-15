/**
 * Solana legacy transaction wire-format serialization.
 *
 * Hand-implemented against Solana's documented binary format rather than
 * pulling in @solana/web3.js's Transaction class — that class lives in
 * the same package as Connection, which pulls in a Node-only websocket
 * dependency that broke this project's Cloudflare Workers SSR build
 * (see solanaService.ts). This module has zero dependency on that
 * package.
 *
 * CONFIDENCE NOTE: this format is stable, public, and well-documented
 * (https://docs.solana.com/developer/guides/tests/transaction), and
 * the encode/decode round-trip plus signature-verification are covered
 * by tests/unit/solana-wire.test.ts. It has NOT been broadcast-tested
 * against a live Solana network or devnet from this environment (no
 * network access here) — test on devnet before any mainnet use.
 */
import { Buffer } from "buffer";
import bs58 from "bs58";
import nacl from "tweetnacl";

export const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

/** Solana's "compact-u16" (shortvec) varint encoding. */
export function encodeCompactU16(n: number): number[] {
  const out: number[] = [];
  let value = n;
  for (;;) {
    const byte = value & 0x7f;
    value >>>= 7;
    if (value === 0) {
      out.push(byte);
      break;
    }
    out.push(byte | 0x80);
  }
  return out;
}

export function decodeCompactU16(
  bytes: Uint8Array,
  offset: number,
): { value: number; next: number } {
  let value = 0;
  let shift = 0;
  let pos = offset;
  for (;;) {
    const byte = bytes[pos];
    value |= (byte & 0x7f) << shift;
    pos++;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }
  return { value, next: pos };
}

export interface CompiledInstruction {
  programIdIndex: number;
  accounts: number[];
  data: Uint8Array;
}

export interface MessageParams {
  feePayer: string; // base58
  recentBlockhash: string; // base58, 32 bytes
  accountKeys: string[]; // base58, in order: [feePayer, ...other signers, ...writable non-signers, ...readonly non-signers]
  numRequiredSignatures: number;
  numReadonlySignedAccounts: number;
  numReadonlyUnsignedAccounts: number;
  instructions: CompiledInstruction[];
}

/** Serializes a transaction Message (header + account keys + blockhash + instructions). */
export function serializeMessage(params: MessageParams): Uint8Array {
  const chunks: number[] = [];

  // Header
  chunks.push(
    params.numRequiredSignatures,
    params.numReadonlySignedAccounts,
    params.numReadonlyUnsignedAccounts,
  );

  // Account keys
  chunks.push(...encodeCompactU16(params.accountKeys.length));
  for (const key of params.accountKeys) chunks.push(...bs58.decode(key));

  // Recent blockhash
  chunks.push(...bs58.decode(params.recentBlockhash));

  // Instructions
  chunks.push(...encodeCompactU16(params.instructions.length));
  for (const ix of params.instructions) {
    chunks.push(ix.programIdIndex);
    chunks.push(...encodeCompactU16(ix.accounts.length));
    chunks.push(...ix.accounts);
    chunks.push(...encodeCompactU16(ix.data.length));
    chunks.push(...ix.data);
  }

  return new Uint8Array(chunks);
}

/** Full signed transaction wire bytes: compact-array of signatures + message. */
export function serializeTransaction(message: Uint8Array, signatures: Uint8Array[]): Uint8Array {
  const sigCountPrefix = encodeCompactU16(signatures.length);
  const totalLen = sigCountPrefix.length + signatures.length * 64 + message.length;
  const out = new Uint8Array(totalLen);
  let offset = 0;
  out.set(sigCountPrefix, offset);
  offset += sigCountPrefix.length;
  for (const sig of signatures) {
    out.set(sig, offset);
    offset += 64;
  }
  out.set(message, offset);
  return out;
}

/** Builds + signs a native SOL transfer. Returns base64-encoded wire transaction ready to broadcast via sendTransaction RPC. */
export function buildSignedSolTransfer(opts: {
  fromSecretKey: Uint8Array; // 64-byte nacl secret key
  fromAddress: string;
  toAddress: string;
  lamports: number;
  recentBlockhash: string;
}): { wireTx: string; messageBytes: Uint8Array; signature: Uint8Array } {
  const accountKeys = [opts.fromAddress, opts.toAddress, SYSTEM_PROGRAM_ID];

  // System Program Transfer instruction: u32 LE instruction index (2) + u64 LE lamports
  const data = new Uint8Array(12);
  new DataView(data.buffer).setUint32(0, 2, true);
  new DataView(data.buffer).setBigUint64(4, BigInt(opts.lamports), true);

  const message = serializeMessage({
    feePayer: opts.fromAddress,
    recentBlockhash: opts.recentBlockhash,
    accountKeys,
    numRequiredSignatures: 1,
    numReadonlySignedAccounts: 0,
    numReadonlyUnsignedAccounts: 1, // SystemProgram
    instructions: [{ programIdIndex: 2, accounts: [0, 1], data }],
  });

  const signature = nacl.sign.detached(message, opts.fromSecretKey);
  const wireBytes = serializeTransaction(message, [signature]);
  const wireTx = Buffer.from(wireBytes).toString("base64");
  return { wireTx, messageBytes: message, signature };
}
