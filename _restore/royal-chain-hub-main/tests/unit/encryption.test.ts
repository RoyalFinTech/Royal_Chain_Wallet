import { describe, it, expect } from "vitest";
import { encryptString, decryptString, hashPin, verifyPinHash } from "@/lib/security/encryption";

describe("security/encryption", () => {
  it("round-trips a string through encrypt/decrypt with the correct passphrase", async () => {
    const secret = "royal chain wallet test mnemonic phrase";
    const enc = await encryptString(secret, "123456");
    const dec = await decryptString(enc, "123456");
    expect(dec).toBe(secret);
  });

  it("fails to decrypt with the wrong passphrase", async () => {
    const enc = await encryptString("some secret", "123456");
    await expect(decryptString(enc, "654321")).rejects.toThrow();
  });

  it("produces a verifiable PIN hash", async () => {
    const { hash, salt } = await hashPin("445566");
    expect(await verifyPinHash("445566", hash, salt)).toBe(true);
    expect(await verifyPinHash("000000", hash, salt)).toBe(false);
  });
});
