# QA Findings

Status meanings: **Open** = found and not yet fixed/verified; **In progress** = a change is being prepared; **Blocked** = a required environment/test prerequisite is unavailable; **Verified** = the fix was checked with a recorded test or read-only query.

## Critical — must block production use

### QA-001 — Wallet creation stores an unowned preview under a known PIN
- **Status:** Open; immediate fix planned.
- **Location:** `src/routes/create-wallet.tsx`.
- **Evidence:** The initial effect calls `createWallet("__preview__")`, and `createWallet` encrypts and writes to browser storage. The user has not yet set their PIN at this point.
- **Impact:** If the user leaves the flow before step 4, the wallet can remain unlockable using a hard-coded PIN.
- **Required fix:** Generate a temporary mnemonic/derived-address preview in memory only; persist exactly once using the user's chosen PIN at the final secure-wallet step. Clear PIN and mnemonic component state after successful save.

### QA-002 — Recovery-phrase import uses a hard-coded PIN
- **Status:** Open; immediate fix planned.
- **Location:** `src/routes/import-wallet.tsx`.
- **Evidence:** Phrase import calls `importWallet(phrase, "royal-chain")`.
- **Impact:** A restored wallet is stored encrypted under a known fixed PIN.
- **Required fix:** Require the user to create and confirm a new PIN before importing/storing the phrase; never write the wallet with a shared default PIN.

### QA-003 — WalletConnect request parsing could sign/send a different transaction than requested
- **Status:** Open; production use must be blocked for transaction requests.
- **Location:** `src/lib/walletconnect/session-manager.ts` and `src/routes/app.walletconnect.tsx`.
- **Evidence:** `eth_sendTransaction` is reduced to `to/value`, converted through JS floating-point arithmetic, then routed through a native-send function that ignores calldata and other request fields. `solana_signTransaction` expects serialized transaction bytes, but the implementation tries to parse it as an object with `to/value`. A BNB request also chooses the Ethereum address in the UI.
- **Impact:** The wallet may misrepresent the dapp's request and sign/broadcast a different action; this is unacceptable for a non-custodial wallet.
- **Required fix:** Reject unsupported transaction signing methods visibly until each chain's request is validated and signed byte-for-byte according to its protocol. Render and confirm the actual decoded transaction details. Add offline unit tests and then test on devnet/testnet. Do not use real funds to validate.

## High priority

### QA-004 — Mock recovery paths claim success without restoring the supplied wallet
- **Status:** Open.
- **Location:** `src/routes/import-wallet.tsx`, `src/lib/wallet-identity.ts`.
- **Evidence:** The encrypted-backup and private-key paths use a delay and `generateWalletIdentity()` rather than parsing/decrypting/importing the selected backup/key.
- **Impact:** Users may think a real wallet was restored when a fake address/identity was generated.
- **Required fix:** Disable unsupported methods or implement verifiable formats; show an honest unsupported message instead of a success card.

### QA-005 — Static demonstration identity appears in real-looking wallet UI
- **Status:** Open.
- **Location:** `src/lib/wallet-identity.ts`, `src/components/wallet/WalletCard.tsx`, `src/routes/app.index.tsx`, `src/routes/qr.tsx`, `src/routes/app.wallet.tsx`.
- **Evidence:** Fixed `DEMO_IDENTITY` and demo name/address are rendered on wallet/dashboard/receive QR screens.
- **Impact:** A user's displayed wallet may not match the actual locally stored keys; a QR may route to a fake address.
- **Required fix:** Bind address displays and receive payloads to the active stored wallet. If no real wallet exists, explicitly show a demo state and prevent it being presented as a real address.

### QA-006 — QR scanner and QR payment success are simulated
- **Status:** Open.
- **Location:** `src/routes/qr.tsx`.
- **Evidence:** Camera grant is only a React state change; a timer returns a hard-coded merchant; fake QR cells are based on payload length; payment completion is a timer that generates fake transaction IDs/hashes.
- **Impact:** The UI falsely indicates scanning/payment has occurred.
- **Required fix:** Build a real camera QR decoder and separate WalletConnect URI scanning from payment QR handling. Until payment broadcast/verification exists, label demos clearly and never claim that funds were sent or a transfer completed.

### QA-007 — Recovery word entry checks only a partial mock dictionary
- **Status:** Open.
- **Location:** `src/components/wallet/RecoveryPhraseInput.tsx`.
- **Evidence:** `SUGGESTION_WORDS` is a small homemade subset; `isKnownWord` checks against it, while the actual wallet engine uses the library's BIP-39 validator.
- **Impact:** Valid words from the standard 2048-word English list may be flagged as invalid.
- **Required fix:** Use the installed BIP-39 wordlist for per-word hints and the official checksum-aware mnemonic validator for restore validity.

### QA-008 — Live Supabase migration sources are incomplete in the repository
- **Status:** Open; migration application blocked until reconciled.
- **Evidence:** Connected project reports migration versions 1–10. Repository `main` contains SQL sources only for migrations 1–4. The prior draft branch added a new file numbered `00000000000005_transaction_security_hardening.sql`, which conflicts with the remote's already-applied migration #5 name.
- **Impact:** A fresh database cannot be reproduced from the source tree and applying the draft branch as-is creates an ambiguous migration history.
- **Required fix:** Recover the exact SQL for remote migrations 5–10 into the repo (or document/export them from the real history), rename a genuinely new migration to a non-colliding #11 sequence, compare schema/policies before applying, and validate in a disposable branch/database.

### QA-009 — Live rate-limit RPC accepts unchecked caller-controlled buckets/limits
- **Status:** Open.
- **Location:** Live `public.check_rate_limit(text,integer,integer)`.
- **Evidence:** Read-only SQL shows the current SECURITY DEFINER body counts/inserts `p_bucket_key`, uses `p_max_requests` and `p_window_seconds` without binding to `auth.uid()`; advisor says `anon` and `authenticated` may execute it.
- **Impact:** A caller can manipulate another bucket or request a nonstandard quota/window; investigate abuse potential and replace with a narrowly scoped implementation.
- **Required fix:** Bind bucket to verified identity and fixed limits (or move limiter to a trusted server-only path). Revoke `EXECUTE` from `PUBLIC`/`anon`; grant only intended roles. Verify by querying ACLs/advisors and running negative tests.

### QA-010 — Live transaction RPC ACL conflicts with signed-in client call
- **Status:** Open.
- **Location:** Live `public.record_transaction_with_ledger(...)`.
- **Evidence:** Current live function ACL checks say `authenticated` cannot execute the function, but the application calls it through the request-authenticated client. No end-to-end call was executed.
- **Impact:** Signed-in transaction recording may fail at runtime; a broad grant would be unsafe without validating the authorization logic.
- **Required fix:** Decide between a verified server-only/service-role endpoint or narrowly authorised authenticated RPC; match the caller design, then add integration tests proving one user cannot mutate another user's wallet or ledger.

### QA-011 — Render has no Royal Chain Wallet service yet
- **Status:** Open; deployment configuration work blocked on runtime confirmation.
- **Evidence:** Connected workspace `Royal's workspace` currently lists services for Eco-Stream, Starling Courier, and Zenith Protocol, not Royal Chain Wallet.
- **Impact:** There is no existing public preview URL for this repo in that workspace.
- **Required fix:** Confirm a Node-compatible server/start command and health check, then create a separate staging/preview service in the confirmed workspace. Do not edit unrelated services.

## Additional observations

### QA-012 — Supabase security/performance advisor findings to triage
- **Status:** Open.
- **Evidence:** Live security advisor reports (a) no RLS policy on `public.rate_limit_events` while the table has RLS enabled; direct anon/auth SELECT/INSERT privileges are denied, so no direct table access was observed, (b) six authenticated-executable SECURITY DEFINER helper functions, one of which is also anon-executable (`check_rate_limit`). Performance advisor reports 13 unindexed foreign keys and 4 auth-RLS initialization-plan warnings.
- **Required fix:** Review each function ACL/body individually; do not blindly revoke admin/identity helper functions without tracing callers. Add foreign-key indexes and use `(select auth.uid())` where appropriate after a migration diff and test.

### QA-013 — No automated verification or live WalletConnect/chain test has been run in this session
- **Status:** Blocked.
- **Evidence:** Container could not resolve GitHub during clone, so it was not possible to install dependencies or run package scripts. GitHub reports no check-runs on the previous PR head. No live relay handshake or devnet/testnet broadcast was attempted.
- **Required fix:** Restore a build-capable environment; run typecheck, tests, lint, production build; then run WalletConnect integration tests and chain tests on testnet/devnet only. Record each actual outcome here and in the log.
