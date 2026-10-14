# Engineering Log

## 2026-10-14 — QA and wallet-safety work

### Repository and CI
- Repository: RoyalFinTech/Royal_Chain_Wallet.
- Working branch: `security/tx-hardening-2026-10-14`. Main was not directly changed.
- Draft PR #1 remains open and unmerged: https://github.com/RoyalFinTech/Royal_Chain_Wallet/pull/1.
- Added GitHub Actions workflow `.github/workflows/qa.yml` for typecheck, tests, lint and production build.
- Initial `npm ci` failed because the committed lockfile missed `lru-cache@11.5.3`. CI synchronized it in commit `c45d092`.
- Checked run at commit `23ee0ebe5b0947992cdffcce9a60f9173ffab27f` passed install, TypeScript typecheck, unit tests, lint and production build. This is CI verification, not a live integration or security certification. Subsequent environment-file hygiene, Render config and engineering-log commits triggered newer runs; latest head `082f703f2ddc8643cdc08174f6ef8a202bf945ec` was pending at the last check and must be green before claiming current-head verification.
- CI run: https://github.com/RoyalFinTech/Royal_Chain_Wallet/actions/runs/38592625049.

### Wallet recovery and WalletConnect
- Wallet creation preview now derives a fresh BIP-39 phrase and addresses in memory rather than saving a preview wallet under a known PIN; persistence waits for a confirmed user PIN.
- Phrase restore validates the mnemonic and waits for the user to choose/confirm a PIN. Partial word suggestions were replaced with the BIP-39 English list.
- Added tests for unique valid 12-word phrases, valid 24-word phrases and recovery-word hints.
- Mock encrypted-backup/private-key restore paths are disabled rather than pretending to restore a wallet.
- WalletConnect now scans with browser `BarcodeDetector` when available and offers manual URI entry as fallback. It only exposes message-signing methods; transaction and typed-data signing are intentionally disabled pending protocol-correct implementation.
- The WalletConnect review screen displays the requested message and signer and rejects unreadable/over-limit payloads or signer-address mismatch. It has not yet been tested against a controlled live dApp/relay.
- General QR payment simulation was removed. Real receive QR encoding still needs implementation.

### Supabase workspace
- Found active project **Royal Chain Wallet**, project ref `jnehlnifltckcfecjhhf`, in **Royal FinTech Company**, region `eu-west-3` (Paris). A new Supabase project is not needed.
- Live migration history lists versions 1–10, while checked-in SQL source only contains migrations 1–4. Proposed migration #11 exists on this branch only.
- Read-only inspection observed zero rows in `public.users`, `public.wallets` and `public.transactions` at the time checked.
- Live `check_rate_limit(text,integer,integer)` is SECURITY DEFINER and executable by `anon` and `authenticated`, with caller-controlled bucket/quota/window inputs. Proposed #11 narrows the intended authenticated bucket and rate-limit parameters; it has not been applied.
- Live `record_transaction_with_ledger(...)` denies EXECUTE to `authenticated` and `anon`, while application code currently calls it using an authenticated client. A trusted invocation design must be proven before any live grant change.
- Supabase advisors reported six authenticated-callable SECURITY DEFINER helper functions, 13 unindexed foreign keys and four RLS auth-init-plan warnings. Review each individually; do not apply blanket changes.
- No live database migration or data mutation was performed.

### Render preview
- Created service `royal-chain-wallet-preview` in **Royal's workspace** (`tea-dadvf02d0e5s73eha320`), service ID `srv-db7qlrbrjlhs73cm4ppg`.
- Preview URL: https://royal-chain-wallet-preview.onrender.com.
- Render dashboard: https://dashboard.render.com/web/srv-db7qlrbrjlhs73cm4ppg.
- Branch: `security/tx-hardening-2026-10-14`; build command `npm ci && npm run build`; start command `npm start`; Node runtime, Frankfurt region, free plan.
- Initial deployment `dep-db7qlrrrjlhs73cm4sug` succeeded and is live on the initial blueprint commit. Render build logs show `npm run build` succeeded and `npm start` launched `.output/server/index.mjs`, listening on port 10000. A later documentation commit triggered deployment `dep-db7qm586v3gs73etbe9g`, which was still building at the last check. The public URL is recorded above; an independent HTTP smoke request could not be made from this execution environment because outbound DNS/network access was unavailable.
- Only public Supabase URL/project ref/publishable key are configured as preview variables. No service-role key or wallet secret was supplied or stored.
- Existing unrelated Render services were left unchanged.

### Repository environment-file hygiene
- The tracked restore-archive file `_restore/royal-chain-hub-main/.env` was removed from the current branch and `.gitignore` now ignores `.env` and `.env.*` while allowing `.env.example`.
- Inspected file contained Supabase URL, project ID and publishable/anon key configuration only; no service-role key was found in that file. Removal does not erase historical Git versions, so if a real secret is ever found in history, rotate it.

## Remaining blockers / next work
1. Recover exact SQL sources for applied migrations #5–#10, compare with live schema/policies/functions/grants, and test a clean reset before reviewing migration #11. Do not apply it to production yet.
2. Add disposable-database integration tests for cross-user wallet/transaction/ledger access, malformed entries, atomic rollback and concurrent rate limits.
3. Verify wallet create/abandon, PIN mismatch, valid/invalid 12- and 24-word recovery, and successful unlock after restore.
4. Validate WalletConnect message encoding and signer address against the supported EVM/Solana adapters; pair with a controlled dApp. Keep transaction signing disabled until implemented and tested.
5. Confirm Render deployment succeeds, then test root page, server functions, auth, scanner/manual URI fallback, and logs.
6. Audit all remaining demo identity/data consumers. Wallet/account creation still makes separate database requests and may leave an orphan wallet if account creation fails.
7. Do not describe this as production-ready until all applicable integration and security gates pass.