/**
 * Repository pattern (Module 10).
 *
 * Generic CRUD contract used by every admin-domain repository below. No
 * database connection in this phase — see mock.ts for the in-memory
 * implementations the admin UI can be wired to next; a Supabase-backed
 * implementation of the same interfaces slots in later without touching
 * admin route components.
 */

export interface Repository<T, TId = string> {
  findAll(): Promise<T[]>;
  findById(id: TId): Promise<T | null>;
  create(input: Omit<T, "id">): Promise<T>;
  update(id: TId, patch: Partial<T>): Promise<T>;
  delete(id: TId): Promise<void>;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
