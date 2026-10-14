# QA Findings

Status key: **Open** = not fixed/verified; **Mitigated** = defensive code exists but needs integration verification; **Verified** = passed a recorded relevant test.

## QA-001 — Preview wallet used a known PIN
- Status: Mitigated; branch CI is green, targeted flow tests still needed.
- Create-wallet preview is now generated in memory and persistence waits for user PIN confirmation.
- Verify abandoning at each pre-PIN step creates no stored wallet.

## QA-002 — Recovery import used a hard-coded PIN / partial dictionary
- Status: Mitigated; tests added, integration checks still needed.
- Mnemonic validation and user-chosen PIN confirmation are used; word hints use the full BIP-39 English list.
- Verify invalid checksum, valid 12/24-word phrases, PIN mismatch and subsequent unlock.

## QA-003 — WalletConnect could approve a different action than the dApp requested
- Status: Mitigated; controlled dApp integration test open.
- Transaction/typed-data signing is disabled; message screen displays the requested message and signer; signer address is validated against derived wallet keys.
- Verify exact EVM/Solana message bytes and reject unsupported methods with a controlled test dApp.

## QA-004 — Fake backup/private-key restore and QR payment success
- Status: Mitigated in UI.
- Unsupported fake restore paths and simulated QR payment receipts/hashes were removed or disabled. Real receive QR encoding remains open.

## QA-005 — Static demo identity and portfolio data
- Status: Partially addressed.
- Main wallet/dashboard/receive-address surfaces use active local wallet data; demo portfolio values may remain and must be explicitly labelled.
- Search all remaining demo identity/data consumers before release.

## QA-006 — npm lockfile mismatch
- Status: Verified by latest CI install.
- CI found missing `lru-cache@11.5.3`; lockfile sync was committed as `c45d092`.
- Latest checked workflow completed `npm ci`, typecheck, tests, lint and build successfully at `23ee0ebe5b0947992cdffcce9a60f9173ffab27f`.

## QA-007 — Environment file tracked in restore archive
- Status: Removed from current branch; history review/secret scanning remains open.
- `_restore/royal-chain-hub-main/.env` was deleted and `.gitignore` now excludes `.env*` except examples.
- Inspected values were Supabase URL/project ref/publishable key configuration, not a service-role key. Current deletion does not rewrite history.

## QA-008 — Supabase migration history drift
- Status: Open; production migration blocked.
- Live project has ten recorded migrations; source SQL #5–#10 is missing from the repository. Candidate migration #11 is not applied.
- Recover sources and validate clean reset plus live schema comparison before any migration.

## QA-009 — Live rate-limit RPC authorization
- Status: Open in live project; proposed mitigation only.
- Live SECURITY DEFINER `check_rate_limit` is callable by anon/authenticated and accepts caller-controlled parameters. Proposed #11 limits it to an authenticated user-owned bucket and fixed quota/window.
- Test grants, RLS, abuse cases and concurrency in a disposable project first.

## QA-010 — Transaction RPC caller ACL mismatch
- Status: Open in live project; deployment blocked.
- Live transaction function denies EXECUTE to authenticated/anon while application code invokes it via authenticated client.
- Do not broadly grant execute. Prove the intended security-definer/service-role or authenticated execution design and test cross-user boundaries.

## QA-011 — Render preview deployment
- Status: In progress.
- Service `royal-chain-wallet-preview` created in Royal's workspace, ID `srv-db7qlrbrjlhs73cm4ppg`, URL https://royal-chain-wallet-preview.onrender.com.
- Initial deploy `dep-db7qlrrrjlhs73cm4sug` succeeded; build logs show the app started and listened on port 10000. A newer commit triggered deployment `dep-db7qm586v3gs73etbe9g`, still building at last check. Browser/HTTP smoke test remains open because outbound DNS access from this execution environment was unavailable.

## QA-012 — Current CI verification
- Status: Verified for branch commit `23ee0ebe5b0947992cdffcce9a60f9173ffab27f` only; latest head is pending.
- GitHub Actions run https://github.com/RoyalFinTech/Royal_Chain_Wallet/actions/runs/38592625049 passed dependency installation, typecheck, tests, lint and build.
- Latest branch head `082f703f2ddc8643cdc08174f6ef8a202bf945ec` had a pending workflow at last check. Any later code change requires another green run; this is not a production security certification.

## QA-013 — Ledger and wallet atomicity
- Status: Open.
- Review `record_transaction_with_ledger` invariants against actual ledger schema and run database integration tests. Wallet record and wallet-account inserts are separate requests and may leave an incomplete wallet if the second step fails.

## QA-014 — Remaining live integrations
- Status: Open.
- No live WalletConnect relay/dApp round-trip, Solana devnet/Bitcoin testnet broadcast, or production transaction was attempted.
- Token transfers for some assets may still be simulated. Confirm actual chain implementations and testnets before enabling user-facing transfers.

## Release decision
- **Not production-ready yet.** Migration drift, database integration/security tests, WalletConnect test-dApp verification and Render smoke test remain outstanding.
- No production Supabase schema/data was changed and no mainnet transaction was sent.