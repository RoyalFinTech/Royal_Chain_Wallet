# Transaction Security Hardening Review

## Changes in this branch

- Transaction reads explicitly confirm wallet ownership before returning records.
- Transaction writes explicitly confirm wallet ownership and that the requested asset is active and belongs to the selected chain.
- The transaction rate limiter now uses the request-authenticated Supabase client. If the rate-limit RPC fails or returns an invalid result, the write is blocked instead of silently allowed.
- Migration `00000000000005_transaction_security_hardening.sql` adds wallet/account/transaction read policies and verifies ownership, asset matching, pending status, ledger account type, account ownership, direction, entry amounts, and balanced totals inside the atomic Postgres transaction.
- The ledger helper is no longer directly executable by `anon` or `authenticated`. The rate-limit RPC is bound to the caller's transaction bucket and fixed quota and uses an advisory transaction lock to serialize concurrent attempts.

## Deployment blocker: user identity mapping

The core schema declares `wallets.user_id` as a foreign key to `public.users(id)`, but current server handlers pass Supabase Auth's `auth.uid()` as `user_id`. The core schema also has a separate nullable `users.auth_user_id` column and no verified sync/mapping mechanism in the reviewed migrations. Before this migration is deployed, verify and fix user provisioning/identity mapping. Otherwise the new ownership policy may reject legitimate requests, and existing wallet creation may already fail on the FK. Do not assume ID equality without confirming it in the target schema.

## Required verification before merge

This branch has not had `npm run typecheck`, `npm test`, ESLint, production build, or a fresh local Supabase migration reset run from this environment. Do not merge or deploy on the basis of static review alone.

1. Apply all migrations to a disposable, clean Supabase database and verify function creation/grants and policies.
2. Verify identity mapping for new and existing users before testing wallet create/list flows.
3. Test two separate authenticated users: one cannot read another user's wallets, wallet accounts, or transactions, nor record a transaction against the other wallet/account.
4. Verify wrong-asset, wrong-chain, wrong-ledger-direction, mismatched amount, unbalanced entries, unauthorized system accounts, and client-supplied `confirmed` status all fail without creating a transaction or ledger entry.
5. Verify the 21st request within 60 seconds is denied, including concurrent requests, and an unavailable limiter denies the write.
6. Run typecheck, tests, lint, and production build; then manually review the diff and SQL against the actual target schema.

## Scope intentionally not addressed

Wallet-record creation still inserts the wallet and wallet accounts in separate requests, so account insertion failure can leave a wallet without accounts. SPL token transfers and real blockchain broadcasts also remain unverified as called out in the existing production-readiness documentation.
