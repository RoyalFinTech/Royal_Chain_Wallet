import { describe, expect, it } from "vitest";
import { isKnownWord } from "@/components/wallet/RecoveryPhraseInput";

describe("recovery phrase word hints", () => {
  it("recognizes words from the full BIP-39 English wordlist", () => {
    expect(isKnownWord("abandon")).toBe(true);
    expect(isKnownWord("zoo")).toBe(true);
    expect(isKnownWord("ABANDON")).toBe(true);
  });

  it("rejects words that are not in the BIP-39 English wordlist", () => {
    expect(isKnownWord("notaword")).toBe(false);
  });
});
