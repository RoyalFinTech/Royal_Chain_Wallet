# Royal Chain Wallet — Engineering Record

This folder is the permanent engineering notebook for QA, security, delivery, and deployment work on Royal Chain Wallet.

## Working rules

1. Record investigation results, decisions, changes, verification status, and blockers in Markdown.
2. Append a dated entry to `ENGINEERING_LOG.md` after each material change or verification pass.
3. Update `QA_FINDINGS.md` when the status or severity of a finding changes.
4. Update `NEXT_STEPS.md` when priorities change. Distinguish *planned*, *in progress*, *verified*, and *blocked* work.
5. Never record secret values, mnemonics, private keys, access tokens, service-role keys, or full environment files.
6. Never claim a test, build, database migration, or deployment passed unless it was actually executed and its result was inspected.
7. Keep production database operations and deployment changes separate from local/repository changes. Review migration drift before applying schema changes.
8. Keep `main` unchanged until changes are reviewed and explicitly merged. Use draft pull requests while security-critical checks are pending.

## Documents

- [Engineering log](ENGINEERING_LOG.md) — chronological work record, observations, decisions, and blockers.
- [QA findings](QA_FINDINGS.md) — prioritised and evidence-based defects.
- [Next steps](NEXT_STEPS.md) — the current implementation and verification sequence.
- [Migration drift report](MIGRATION_DRIFT.md) — comparison of repository migration sources with connected Supabase history.

## Current working context

- Repository: `RoyalFinTech/Royal_Chain_Wallet`
- Working branch: `security/tx-hardening-2026-10-14`
- Draft PR: [#1 — Harden transaction authorization and ledger writes](https://github.com/RoyalFinTech/Royal_Chain_Wallet/pull/1)
- Supabase project found: **Royal Chain Wallet**, project ref `jnehlnifltckcfecjhhf`, organization **Royal FinTech Company**
- Render workspace found: **Royal's workspace** (`tea-dadvf02d0e5s73eha320`)

The connected Supabase and Render details above are resource identifiers, not credentials. See the log for the observation timestamps and verification limits.
