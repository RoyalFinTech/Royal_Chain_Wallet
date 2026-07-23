/**
 * Mock authentication provider (Module 12).
 * Implements AuthenticationService in-memory for tests that need auth
 * flows without a real backend.
 */
import type { AuthenticationService } from "@/lib/interfaces/platform-domain";
import type { UserRecord } from "@/lib/db/models";

export function createMockAuthProvider(): AuthenticationService {
  const users = new Map<string, UserRecord & { password: string; pin: string }>();

  return {
    async signUp(email, password) {
      const user: UserRecord & { password: string; pin: string } = {
        id: `usr_${users.size + 1}`,
        auth_user_id: null,
        email,
        phone: null,
        display_name: null,
        preferred_currency: "USD",
        preferred_locale: "en",
        kyc_status: "none",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        password,
        pin: "000000",
      };
      users.set(email, user);
      return user;
    },
    async signIn(email, password) {
      const user = users.get(email);
      if (!user || user.password !== password) throw new Error("Invalid credentials");
      return { user, sessionToken: `mock_token_${user.id}` };
    },
    async signOut() {
      /* no-op */
    },
    async verifyPin(userId, pin) {
      const user = [...users.values()].find((u) => u.id === userId);
      return user?.pin === pin;
    },
    async changePin(userId, oldPin, newPin) {
      const user = [...users.values()].find((u) => u.id === userId);
      if (!user || user.pin !== oldPin) throw new Error("Incorrect PIN");
      user.pin = newPin;
    },
    async requestPasswordReset() {
      /* no-op */
    },
    async enableBiometrics() {
      /* no-op */
    },
  };
}
