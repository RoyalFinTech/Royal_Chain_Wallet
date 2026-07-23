import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import {
  encodeCompactU16,
  decodeCompactU16,
  serializeMessage,
  serializeTransaction,
  buildSignedSolTransfer,
  SYSTEM_PROGRAM_ID,
} from "@/lib/services/tx/solana-wire";

describe("solana-wire: compact-u16 varint", () => {
  it("round-trips small and large values correctly", () => {
    for (const n of [0, 1, 127, 128, 129, 16383, 16384, 65535]) {
      const encoded = new Uint8Array(encodeCompactU16(n));
      const { value, next } = decodeCompactU16(encoded, 0);
      expect(value).toBe(n);
      expect(next).toBe(encoded.length);
    }
  });
});

describe("solana-wire: message serialization structure", () => {
  it("produces the exact byte layout the Solana wire format specifies", () => {
    const kp = nacl.sign.keyPair();
    const from = bs58.encode(kp.publicKey);
    const to = bs58.encode(nacl.sign.keyPair().publicKey);
    const blockhash = bs58.encode(new Uint8Array(32).fill(7));

    const data = new Uint8Array(12);
    new DataView(data.buffer).setUint32(0, 2, true);
    new DataView(data.buffer).setBigUint64(4, 1_000_000n, true);

    const message = serializeMessage({
      feePayer: from,
      recentBlockhash: blockhash,
      accountKeys: [from, to, SYSTEM_PROGRAM_ID],
      numRequiredSignatures: 1,
      numReadonlySignedAccounts: 0,
      numReadonlyUnsignedAccounts: 1,
      instructions: [{ programIdIndex: 2, accounts: [0, 1], data }],
    });

    // header (3 bytes) + compact-u16(3 accounts)=1 byte + 3*32 bytes keys +
    // 32 bytes blockhash + compact-u16(1 instruction)=1 byte + 1 byte
    // programIdIndex + compact-u16(2 accounts)=1 byte + 2 bytes account
    // indices + compact-u16(12 data len)=1 byte + 12 bytes data
    const expectedLen = 3 + 1 + 96 + 32 + 1 + 1 + 1 + 2 + 1 + 12;
    expect(message.length).toBe(expectedLen);

    // Header bytes are exactly [1, 0, 1]
    expect(Array.from(message.slice(0, 3))).toEqual([1, 0, 1]);

    // Account count byte is 3
    expect(message[3]).toBe(3);

    // The three 32-byte account keys appear in order right after the count byte
    const key0 = message.slice(4, 36);
    expect(bs58.encode(key0)).toBe(from);
  });

  it("serializeTransaction prepends a correctly-length-prefixed signature array", () => {
    const message = new Uint8Array([1, 2, 3, 4]);
    const sig = new Uint8Array(64).fill(9);
    const tx = serializeTransaction(message, [sig]);
    expect(tx[0]).toBe(1); // compact-u16(1 signature) == single byte 0x01
    expect(tx.slice(1, 65)).toEqual(sig);
    expect(tx.slice(65)).toEqual(message);
  });
});

describe("solana-wire: buildSignedSolTransfer produces a cryptographically valid signature", () => {
  it("the signature verifies against the exact message bytes with the signer's public key", () => {
    const kp = nacl.sign.keyPair();
    const fromAddress = bs58.encode(kp.publicKey);
    const toAddress = bs58.encode(nacl.sign.keyPair().publicKey);
    const recentBlockhash = bs58.encode(new Uint8Array(32).fill(3));

    const { messageBytes, signature } = buildSignedSolTransfer({
      fromSecretKey: kp.secretKey,
      fromAddress,
      toAddress,
      lamports: 500_000_000,
      recentBlockhash,
    });

    const valid = nacl.sign.detached.verify(messageBytes, signature, kp.publicKey);
    expect(valid).toBe(true);
  });

  it("a signature signed by the WRONG key fails verification (sanity check the verifier itself works)", () => {
    const kp = nacl.sign.keyPair();
    const wrongKp = nacl.sign.keyPair();
    const fromAddress = bs58.encode(kp.publicKey);
    const toAddress = bs58.encode(nacl.sign.keyPair().publicKey);
    const recentBlockhash = bs58.encode(new Uint8Array(32).fill(3));

    const { messageBytes, signature } = buildSignedSolTransfer({
      fromSecretKey: kp.secretKey,
      fromAddress,
      toAddress,
      lamports: 1,
      recentBlockhash,
    });

    // Verifying against a different public key must fail.
    const valid = nacl.sign.detached.verify(messageBytes, signature, wrongKp.publicKey);
    expect(valid).toBe(false);
  });

  it("produces a base64 wire transaction of a sane, non-empty length", () => {
    const kp = nacl.sign.keyPair();
    const { wireTx } = buildSignedSolTransfer({
      fromSecretKey: kp.secretKey,
      fromAddress: bs58.encode(kp.publicKey),
      toAddress: bs58.encode(nacl.sign.keyPair().publicKey),
      lamports: 1,
      recentBlockhash: bs58.encode(new Uint8Array(32).fill(1)),
    });
    const decoded = Buffer.from(wireTx, "base64");
    // 1 (sig count) + 64 (sig) + message bytes
    expect(decoded.length).toBeGreaterThan(64);
    expect(decoded.length).toBeLessThan(300); // sanity bound for a simple transfer
  });
});
