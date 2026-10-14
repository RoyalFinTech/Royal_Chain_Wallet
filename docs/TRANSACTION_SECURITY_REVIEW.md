# Transaction Security Hardening Review

## Changes in this branch

- Authentication middleware verifies the Supabase token and resolves the corresponding `public.users.id` using `auth_user_id`. Database rows that reference `public.users(id)` are scoped by this profile ID; the Auth subject remains separate for JWT checks and rate-limit buckets.
- The migration adds a unique mapping for `users.auth_user_id`, own-profile RLS policies, and a trigger that creates a profile row for new Auth users. Sign-up without a session returns a provisional profile shape and does not try to bypass RLS.
- Transaction reads and writes explicitly verify ownership. Writes also check that the requested asset is active and matches the selected chain.
- Transaction rate limiting now uses the request-authenticated Supabase client. If the rate-limit RPC fails or returns an invalid result, the write is blocked instead of silently allowed.
- The database recording function verifies the Auth-to-profile mapping, wallet ownership, active asset/chain matching, pending-only initial status, two-entry ledger shape, account type and ownership, entry direction, per-entry amount, and balanced totals before performing the atomic insert.
- Direct execution of the ledger helper is revoked from `anon` and `authenticated`. The rate-limit RPC is bound to the caller's own transaction bucket and fixed quota and uses a transaction advisory lock to serialize concurrent attempts.
- Wallet, portfolio, notification, session, and device server endpoints now use the resolved application profile ID for rows keyed to `public.users(id)`. Settings continue to query `auth_user_id`.

## Data reconciliation before deployment

The migration adds a unique index for `users.auth_user_id`; applying it will fail if duplicate non-null mappings already exist. Inspect and reconcile any duplicate profile mappings first. The auth trigger creates profiles for future sign-ups; existing users missing profiles are created by `ensureProfile` during sign-in. Verify this in a disposable Supabase project before applying to any existing database.

## Required verification before merge

This branch has not had `npm run typecheck`, `npm test`, ESLint, a production build, or a fresh local Supabase migration reset run from this environment. Do not merge or deploy on the basis of static review alone.

1. Apply all migrations to a clean, disposable Supabase database and verify the trigger, function grants, and RLS policies.
2. Test sign-up both with and without email confirmation; then sign in and verify each session resolves the correct `public.users.id`.
3. Test two authenticated users: one cannot read another user's wallets, wallet accounts, or transactions, nor record a transaction against the other wallet/account.
4. Verify wrong-asset, wrong-chain, wrong-ledger-direction, mismatched amount, unbalanced entries, unauthorized system accounts, and client-supplied `confirmed` status all fail without creating a transaction or ledger entry.
5. Verify the 21st request within 60 seconds is denied, including concurrent requests, and that an unavailable rate limiter denies the write.
6. Run typecheck, tests, lint, and production build; then review the complete diff and SQL against the target schema.

## Scope intentionally not addressed

Wallet-record creation still inserts the wallet and wallet accounts in separate requests, so account insertion failure can leave a wallet without accounts. Some durable notifications/session/device operations have no policies in the reviewed baseline and remain deny-by-default until their intended access rules are implemented. SPL token transfers and real blockchain broadcasts also remain unverified as noted in the production-readiness documentation.
