import { describe, expect, it } from "vitest";
import { chooseVerificationIndices } from "@/lib/security/recovery-challenge";

describe("randomized recovery phrase challenge", () => {
  it("selects six unique word positions within a 12-word phrase", () => {
    const indices = chooseVerificationIndices(12, 6);
    expect(indices).toHaveLength(6);
    expect(new Set(indices).size).toBe(6);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    expect(indices.every((index) => index >= 0 && index < 12)).toBe(true);
  });

  it("supports a 24-word phrase and a configurable challenge size", () => {
    const indices = chooseVerificationIndices(24, 4);
    expect(indices).toHaveLength(4);
    expect(new Set(indices).size).toBe(4);
    expect(indices.every((index) => index >= 0 && index < 24)).toBe(true);
  });

  it("rejects invalid sizes", () => {
    expect(() => chooseVerificationIndices(0)).toThrow(RangeError);
    expect(() => chooseVerificationIndices(12, 0)).toThrow(RangeError);
  });
});
