import { describe, it, expect } from "vitest";
import { deriveAllChains, generateMnemonic, validateMnemonic } from "@/lib/wallet/derive";
import { makeMnemonicFixture } from "../utils/helpers";

describe("wallet/derive", () => {
  it("generates a valid 12-word mnemonic", () => {
    const m = generateMnemonic(128);
    expect(m.split(" ")).toHaveLength(12);
    expect(validateMnemonic(m)).toBe(true);
  });

  it("rejects an invalid mnemonic", () => {
    expect(validateMnemonic("not a real mnemonic at all here")).toBe(false);
  });

  it("derives well-formed addresses on every chain", async () => {
    const addresses = await deriveAllChains(makeMnemonicFixture());
    expect(addresses.bitcoin.address).toMatch(/^bc1[a-z0-9]+$/);
    expect(addresses.ethereum.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(addresses.bnb.address).toBe(addresses.ethereum.address); // EVM-shared
    expect(addresses.solana.address.length).toBeGreaterThan(30);
  });

  it("is deterministic — same mnemonic always derives the same addresses", async () => {
    const a = await deriveAllChains(makeMnemonicFixture());
    const b = await deriveAllChains(makeMnemonicFixture());
    expect(a.bitcoin.address).toBe(b.bitcoin.address);
    expect(a.ethereum.address).toBe(b.ethereum.address);
    expect(a.solana.address).toBe(b.solana.address);
  });
});
