# Supabase Migration Drift Report

Date checked: 2026-10-14
Project: **Royal Chain Wallet** (`jnehlnifltckcfecjhhf`)
Organization: **Royal FinTech Company**
Region: `eu-west-3`

## Live migration history

The connected Supabase project reports the following migration history:

| Version | Migration name |
| --- | --- |
| 20260728115057 | `00000000000001_royal_chain_core_schema` |
| 20260728115115 | `00000000000002_rate_limiting` |
| 20260728115139 | `00000000000003_ledger_and_currencies` |
| 20260728183025 | `00000000000004_atomic_transaction_recording` |
| 20260728183128 | `00000000000005_rls_policies_and_hardening` |
| 20260728183149 | `00000000000006_rbac_seed` |
| 20260728183204 | `00000000000007_edge_function_support` |
| 20260728183229 | `00000000000008_system_ledger_accounts` |
| 20260730013509 | `00000000000009_lock_down_internal_ledger_functions` |
| 20260731003918 | `00000000000010_transactions_tx_hash_unique` |

## Repository state observed

On repository `main`, source SQL files exist only for migrations #1–#4:
- `00000000000001_royal_chain_core_schema.sql`
- `00000000000002_rate_limiting.sql`
- `00000000000003_ledger_and_currencies.sql`
- `00000000000004_atomic_transaction_recording.sql`

The active security branch initially introduced `00000000000005_transaction_security_hardening.sql`; this is not a safe final migration number because the live database already has a different migration #5. It must be renamed/reconciled to a fresh migration sequence after #10 before review.

## Risk and safe handling

- A fresh environment cannot currently reproduce the full live schema from the repository migration directory.
- Do not reset production, replay migration #1–#4, or apply a new DDL migration until missing sources #5–#10 have been recovered and drift has been reviewed.
- The connected project is active and has a complete migration history registered; the issue is missing source files in the repository, not an absence of migrations in Supabase.
- Read-only inspection found the live function ACL for `record_transaction_with_ledger(...)` denies execute to `authenticated` and `anon`, although application server code calls it with an authenticated client. A safe invocation design must be agreed and tested; do not grant broad execution merely to silence the error.
- Read-only inspection found the current live `check_rate_limit(...)` is a SECURITY DEFINER RPC executable by `anon` and `authenticated`, with no bound to the caller identity and caller-chosen quota/window values. Correct this via a separate, tested migration after review.
- Live rows count is zero for `public.users`, `public.wallets`, and `public.transactions` at the time of the read-only check.

## Next reconciliation steps

1. Recover the exact historical SQL for applied migrations #5–#10 from Git history, Supabase project source control or backups.
2. Compare `pg_policies`, function definitions/ACLs, trigger definitions, constraints, indexes, and grants against all migration files.
3. Add missing migrations to the repo without altering their original content/history.
4. Renumber only the new, not-yet-applied security migration to #11 (or a suitable unique timestamped migration identifier), preserving one source file per registered migration.
5. Reset a disposable Supabase database from repo sources and compare its schema/policy/function outputs with the connected project's read-only inventory.
6. Run security advisors before/after the candidate migration and document the outcome.
