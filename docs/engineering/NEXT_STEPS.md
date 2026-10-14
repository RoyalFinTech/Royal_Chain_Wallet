# Next Steps

Last updated: 2026-10-14.

## 1. Confirm the Render preview
1. Check deploy `dep-db7qlrrrjlhs73cm4sug` and fix build/runtime errors if any.
2. Open https://royal-chain-wallet-preview.onrender.com and test the home route, server rendering, auth/config screens and browser console.
3. Test WalletConnect scanner permissions on supported browsers and manual URI fallback on unsupported browsers.
4. Confirm service env contains only required public config. Add WalletConnect project ID directly in Render settings if a real one is available; do not put it in Git or chat.

## 2. Reconcile Supabase before migration
1. Recover exact source SQL for already-applied migrations #5–#10.
2. Compare functions, grants, RLS policies, triggers, constraints and indexes against the connected project.
3. Apply all migrations to a disposable database and verify a clean reset.
4. Test candidate #11 with two users, cross-user wallet/transaction/ledger attempts, invalid ledger entries, atomic rollback and concurrent rate limiting.
5. Only after review and explicit approval, plan a production migration. Do not reset production or apply candidate #11 yet.

## 3. Wallet key/recovery QA
1. Verify generated phrases have fresh entropy and valid BIP-39 checksum for both 12 and 24 words.
2. Verify wallet creation does not persist anything until PIN confirmation.
3. Test restore with invalid checksum, wrong word, wrong PIN, PIN mismatch and successful unlock.
4. Confirm no phrase/private key is sent to the server, logs, telemetry or crash reports.
5. Implement actual encrypted-backup import only after its format is specified and tested; keep fake restore options disabled.

## 4. WalletConnect
1. Validate EVM `personal_sign` and Solana `solana_signMessage` argument order/encoding against the exact supported adapter versions.
2. Verify byte-for-byte that the message displayed is the payload signed.
3. Pair with a controlled test dApp and test approve/reject, wrong signer, wrong chain, malformed URI and unsupported signing methods.
4. Keep transaction and typed-data signing disabled until transaction parsing, human-readable review, chain-specific signing and test coverage are complete.

## 5. Remaining product/engineering gaps
1. Audit remaining demo identity, mock balances, transaction history, simulated token transfers and fallback behavior.
2. Make wallet + wallet-account persistence atomic or add compensating cleanup and tests.
3. Add real receive-address QR encoding with chain-specific URI formats; do not fake payment confirmations.
4. Review Supabase advisor findings one by one; do not apply blanket grants or indexes without schema evidence.

## Release gates
- [ ] Latest branch head has green install/typecheck/tests/lint/build.
- [ ] Render preview build and HTTP smoke tests pass.
- [ ] Migrations #5–#10 recovered; clean reset matches live schema.
- [ ] Candidate #11 passes disposable-database security and rollback tests.
- [ ] Wallet create/import/PIN flows pass targeted tests.
- [ ] WalletConnect controlled dApp integration passes and unsupported methods fail closed.
- [ ] Remaining demo/simulation behavior is removed or clearly labelled.
- [ ] No secrets are committed or placed in VITE_ variables unless designed to be public.
- [ ] Production changes are reviewed and explicitly approved.