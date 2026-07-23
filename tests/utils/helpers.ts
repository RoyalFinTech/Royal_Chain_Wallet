/**
 * Testing utilities (Module 12).
 */
export function makeMnemonicFixture(): string {
  // A well-known BIP-39 test vector — valid checksum, never used for real funds.
  return "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
}

export async function expectRejects(
  promise: Promise<unknown>,
  messageIncludes?: string,
): Promise<void> {
  try {
    await promise;
    throw new Error("Expected promise to reject, but it resolved.");
  } catch (e) {
    if (messageIncludes && e instanceof Error && !e.message.includes(messageIncludes)) {
      throw new Error(`Expected error message to include "${messageIncludes}", got "${e.message}"`);
    }
  }
}
