# Engineering Log

## 2026-10-14 — Connected workspace discovery and wallet recovery QA

### Scope

Continue the repository-wide QA, inspect connected infrastructure, record all findings, and address wallet-generation/recovery faults. No production database DDL or Render deployment was executed during this pass.

### Git/GitHub

- Confirmed the repository is `RoyalFinTech/Royal_Chain_Wallet`.
- Continued working on `security/tx-hardening-2026-10-14`; last verified branch head before this log entry: `73a4e9f6e2121619dfd96a249d449d189dda3cd4`.
- Existing draft PR #1 remains open and unmerged: https://github.com/RoyalFinTech/Royal_Chain_Wallet/pull/1.
- The previous security branch contains authorization/rate-limit changes and a proposed migration. It is still unverified by local test runs or a disposable Supabase migration reset. Do not merge it yet.
- Tried cloning the branch for local verification. The container could not resolve `github.com` (DNS/network failure); no local tests or build were run as a result.

### Supabase workspace check

- Connected organization found: **Royal FinTech Company**.
- Project found: **Royal Chain Wallet**, ref `jnehlnifltckcfecjhhf`, region `eu-west-3` (Paris), status `ACTIVE_HEALTHY`.
- The project has **10 recorded migrations** (#1 through #10; see [migration drift report](MIGRATION_DRIFT.md)).
- The current repository `main` tree contains only migration source files #1 through #4. The working security branch also has a proposed migration named `00000000000005_transaction_security_hardening.sql`, but the connected database's migration #5 already has the name `00000000000005_rls_policies_and_hardening`. A new source migration must not reuse that sequence. The current branch migration needs to be renamed/reconciled as a new migration after #10, and the missing applied SQL sources must be recovered or formally documented before release.
- Read-only SQL showed the live database uses `public.users.auth_user_id` to map Supabase Auth identities to `public.users.id`. The `users`, `wallets`, and `transactions` tables currently report zero rows.
- Read-only inspection found `public.check_rate_limit(text,integer,integer)` is a `SECURITY DEFINER` function whose current live body counts/inserts using the caller-supplied bucket key without checking ownership of that bucket or fixing the quota. The Supabase security advisor reports that `anon` and `authenticated` can execute it. Direct table SELECT/INSERT privileges on `rate_limit_events` remain denied to those roles; its RLS-enabled/no-policy advisor finding is therefore informational for direct table access, but the RPC permission issue requires correction.
- Read-only inspection found `record_transaction_with_ledger(...)` is not executable by the `authenticated` or `anon` roles in the live database (current ACL checks), despite client-side transaction code invoking it through the signed-in Supabase client. This needs a deliberate service-role/server-only or narrowly authorised RPC design and an integration test; do not grant broad access as a quick fix.
- Supabase security advisor: additionally reported 6 authenticated-callable `SECURITY DEFINER` functions (admin/identity helpers), 13 unindexed foreign keys, and 4 RLS auth-init-plan warnings. Review individually; do not blanket-revoke working admin policy helpers without understanding their callers.
- No migration was applied and no database schema/data was modified.

### Render workspace check

- Connected workspace found: **Royal's workspace**, ID `tea-dadvf02d0e5s73eha320`.
- Its current services (`ecostream`, `starling-courier-service`, `Zenith-protocol-`) are connected to unrelated repositories. No Royal Chain Wallet service exists in the list inspected.
- No Render service was created, changed, or deployed. The application currently has no `start` script in `package.json`, and its Vite/TanStack config uses the Lovable config with Nitro's Cloudflare-oriented default; the production server/runtime output must be confirmed before creating a Render Node service.
- Do not set variables on any of the three unrelated services. For a future preview service, use the confirmed Royal's workspace and only the exact repository/branch. Do not paste secrets into GitHub or this log; use Render's environment editor for secrets.

### Wallet/recovery review

- `src/routes/create-wallet.tsx` currently calls `createWallet("__preview__")` inside its initial effect. This writes the generated wallet into browser storage before the user chooses a PIN. If the flow is abandoned, the stored wallet remains encrypted with a fixed, known PIN. This is a security defect, not just a preview implementation detail.
- `src/routes/import-wallet.tsx` restores a BIP-39 phrase with the fixed PIN `royal-chain`, and the backup/private-key options are simulated success paths that create a fake wallet identity. These flows need to require a user-chosen PIN for real phrase imports and stop claiming success for unsupported backup/private-key formats.
- `src/lib/wallet/derive.ts` uses the BIP-39 library for mnemonic generation and proper derivation. The normal create flow should therefore produce random BIP-39 phrases. The repeated static-looking phrase/name issue comes from separate demo code: `src/lib/wallet-identity.ts` has a fixed `DEMO_IDENTITY` plus a short `Math.random()`-based mock word list; `WalletCard`, dashboard, QR receive/scanning, and import fallback paths consume demo identity.
- `src/components/wallet/RecoveryPhraseInput.tsx` validates entered words against a short partial mock list instead of the complete BIP-39 English wordlist, so valid phrases can be flagged incorrectly.
- `src/routes/qr.tsx` has a generated-looking `FakeQR`, a simulated scan timer, and a simulated “Payment Successful” result. Its scan-permission button does not open the camera. WalletConnect's UI links to this scanner even though it cannot scan QR payloads.
- `src/lib/walletconnect/session-manager.ts` documents unverified WalletKit relay behavior and has unsafe placeholder transaction parsing. The current `solana_signTransaction` path cannot correctly parse serialized Solana transactions; the EVM parser reduces a dapp's request to a native `to/value` transfer, ignores transaction calldata/gas/other fields, and uses a floating-point amount conversion. Those methods must not be treated as production-ready signing. WalletConnect UI also picks Ethereum as `fromAddress` for all non-Solana requests, even BNB.
- The initial security fixes remain unverified. No live WalletConnect relay/session round-trip or on-chain test transaction has been executed.

### Actions completed in this record

- Created the engineering record folder and this log, plus QA findings, next steps, and migration drift documents.
- Recorded which checks were run (read-only only) and which were not run.
- Prioritised immediate wallet-generation and recovery-PIN fixes before attempting Render deployment.
