/**
 * Mock repositories (Module 12).
 * In-memory implementations of the repository interfaces (Module 10) for
 * testing admin-domain logic without a database.
 */
import type { UsersRepository } from "@/lib/admin/repositories/domain";
import type { UserRecord } from "@/lib/db/models";
import type { PagedResult } from "@/lib/admin/repositories/types";

export function createMockUsersRepository(seed: UserRecord[] = []): UsersRepository {
  const store = [...seed];
  return {
    async list(opts): Promise<PagedResult<UserRecord>> {
      const query = opts?.query?.toLowerCase();
      const filtered = query ? store.filter((u) => u.email?.toLowerCase().includes(query)) : store;
      const page = opts?.page ?? 1;
      const pageSize = opts?.pageSize ?? 20;
      const start = (page - 1) * pageSize;
      return {
        items: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
      };
    },
    async flag(userId, reason) {
      const user = store.find((u) => u.id === userId);
      if (!user) throw new Error("User not found");
      void reason;
      return user;
    },
    async verifyKyc(userId) {
      const user = store.find((u) => u.id === userId);
      if (!user) throw new Error("User not found");
      user.kyc_status = "verified";
      return user;
    },
  };
}
