/**
 * Recovery phrase confirmation challenge.
 *
 * Only positions are randomized; the mnemonic itself is generated and managed
 * by the wallet's BIP-39 implementation. Uses Web Crypto rather than Math.random.
 */
export function chooseVerificationIndices(wordCount: number, requestedCount = 6): number[] {
  if (!Number.isInteger(wordCount) || wordCount < 1) {
    throw new RangeError("wordCount must be a positive integer");
  }
  if (!Number.isInteger(requestedCount) || requestedCount < 1) {
    throw new RangeError("requestedCount must be a positive integer");
  }
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure randomness is unavailable for recovery phrase verification.");
  }

  const indices = Array.from({ length: wordCount }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const random = new Uint32Array(1);
    globalThis.crypto.getRandomValues(random);
    const j = random[0] % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, Math.min(requestedCount, wordCount)).sort((a, b) => a - b);
}
