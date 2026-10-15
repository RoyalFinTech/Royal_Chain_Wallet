# Supabase Migration Drift Report

Checked: 2026-10-14.
Project: Royal Chain Wallet (`jnehlnifltckcfecjhhf`).
Organization: Royal FinTech Company.
Region: `eu-west-3` (Paris).

## Registered live migrations

| Source version | Migration |
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

## Repository source state
- SQL sources #1–#4 are present in the main migration folder.
- Source SQL #5–#10 was not found in the repository tree or organization-scoped GitHub code search during this check.
- Proposed `supabase/migrations/00000000000011_transaction_security_hardening.sql` exists on the QA branch and is not applied to the live project.
- A clean database cannot currently be reproduced from the checked-in migration history alone.

## Read-only findings
- Project state was reported as active/healthy; a new Supabase project is not needed.
- Read-only counts were zero in `public.users`, `public.wallets`, and `public.transactions` at inspection time.
- Live `check_rate_limit(text,integer,integer)` is SECURITY DEFINER and executable by `anon` and `authenticated`, and caller-controlled bucket/quota/window values need restriction.
- Live `record_transaction_with_ledger(...)` denies execute to `authenticated` and `anon`, while current app code calls it through an authenticated client.
- Advisors reported six authenticated-callable SECURITY DEFINER helper functions, 13 unindexed foreign keys and four RLS auth-init-plan warnings.
- No live DDL or data mutation was performed.

## Reconciliation procedure
1. Recover exact migration SQL #5–#10 from Git history, backups, Supabase source control or the original development environment.
2. Compare each recovered migration to live `pg_policies`, function definitions and ACLs, triggers, constraints, indexes and grants.
3. Restore the original historical filenames and versions; keep new work on migration #11 or later.
4. Apply the complete history to a disposable database and compare its schema to the live inventory.
5. Test candidate #11, RLS boundaries, transaction rollback, ledger invariants and concurrent rate limits in that disposable database.
6. Obtain review and explicit approval before any production migration.

Never reset production, replay migrations #1–#4 against the live project, or apply migration #11 while source drift remains unresolved.