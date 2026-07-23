import { describe, it, expect } from "vitest";
import { createMockChainAdapter } from "../mocks/blockchain-providers";
import { createMockAuthProvider } from "../mocks/auth-provider";
import { createMockUsersRepository } from "../mocks/repositories";

describe("mock blockchain provider", () => {
  it("implements the ChainAdapter contract deterministically", async () => {
    const adapter = createMockChainAdapter("solana");
    const status = await adapter.getNetworkStatus();
    expect(status.chain).toBe("solana");
    const health = await adapter.healthCheck();
    expect(health.healthy).toBe(true);
  });
});

describe("mock auth provider", () => {
  it("supports sign-up, sign-in, and PIN verification", async () => {
    const auth = createMockAuthProvider();
    const user = await auth.signUp("test@royalchain.test", "hunter2");
    const { sessionToken } = await auth.signIn("test@royalchain.test", "hunter2");
    expect(sessionToken).toContain(user.id);
    expect(await auth.verifyPin(user.id, "000000")).toBe(true);
    expect(await auth.verifyPin(user.id, "111111")).toBe(false);
  });
});

describe("mock users repository", () => {
  it("lists and paginates seeded users", async () => {
    const repo = createMockUsersRepository([
      {
        id: "1",
        auth_user_id: null,
        email: "a@x.com",
        phone: null,
        display_name: null,
        preferred_currency: "USD",
        preferred_locale: "en",
        kyc_status: "none",
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        auth_user_id: null,
        email: "b@x.com",
        phone: null,
        display_name: null,
        preferred_currency: "USD",
        preferred_locale: "en",
        kyc_status: "none",
        created_at: "",
        updated_at: "",
      },
    ]);
    const page = await repo.list({ pageSize: 1, page: 1 });
    expect(page.total).toBe(2);
    expect(page.items).toHaveLength(1);
  });
});
