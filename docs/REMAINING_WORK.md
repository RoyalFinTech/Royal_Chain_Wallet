# Remaining Work — release blockers after 2026-10-14 QA

## Release decision

**Royal Chain Wallet is not production-ready for real-money use.** The repository now fails closed for many unsupported operations instead of fabricating successful transactions, but live integrations, testnet verification, database reconciliation, and a security review are still required.

## P0 — before any real-money or mainnet launch

1. **Reconcile Supabase schema and migrations.** Read-only inspection reports live migration history versions 1–10, but this repository only contains SQL sources 1–4 and proposed migration 11. Recover and review migrations 5–10, diff the actual live schema/grants/policies/functions against expected source, and verify a clean reset in a disposable project. Do not apply migration 11 until a reviewed rollout and rollback plan exists.
2. **Implement and test a trusted transaction verifier.** The browser-facing `recordTransaction` endpoint intentionally fails closed. Build a server-side service that validates chain, source wallet, asset, exact transaction hash, amount, destination, and confirmation/finality using trusted RPC/provider data, then calls the privileged ledger function with least privilege. Do not allow a client to assert that a transaction is confirmed.
3. **Prove RLS and ledger authorization.** Test cross-user reads/writes with two distinct users on a disposable database; verify wallet ownership and account ownership; test malformed, unbalanced, wrong-asset, wrong-chain and mismatched-amount postings; verify atomic rollback and concurrent rate-limit behavior. Audit all SECURITY DEFINER function grants in the live project individually.
4. **Test transaction signing on testnets.** Broadcast small test amounts on Bitcoin testnet, Ethereum Sepolia, BNB testnet, and Solana devnet. Exercise successful, failed, pending, timed-out and dropped transactions; verify fee, recipient, balance, chain ID, replay and duplicate-broadcast handling. Do not enable mainnet until an independent review is complete.
5. **Confirm wallet derivation and recovery.** Test newly generated 12-word phrases and imported valid 12/24-word phrases, invalid checksum rejection, correct/wrong PIN, create-abandon, encrypted persistence, reload, restore on a new browser profile, and address consistency for all four supported chains. A real recovery phrase must never appear in logs, analytics, or server payloads.
6. **Security audit and launch governance.** Review browser storage/XSS threats, PIN-derived encryption parameters, CSP, dependencies, error logging, privacy/terms, incident response and backup guidance. The browser wallet is non-custodial but remains exposed to compromised devices or injected scripts.

## P1 — core crypto functionality

- **Real balance and price data:** configure trusted RPC/indexers for each supported network and a live market-price provider. Until then the UI shows RPC status and clearly labels estimated values. An RPC endpoint alone is not a price feed.
- **Royal Token (ROY):** choose the final chain/network, deploy or verify the SPL mint, decide decimals/supply cap/authority model, implement and test metadata, mint authority protection (prefer reviewed multisig/timelock), supply/holder reads, and real SPL transfers. No verified live mint/program is currently enabled. Admin Mint/Burn remains disabled; do not mint on mainnet yet.
- **SPL assets (ROY/USDT/USDC):** integrate real mint addresses, Associated Token Accounts, token-balance reads, safe decimal handling and signed SPL transfer instructions. These flows currently fail closed.
- **Swap:** connect an audited router/aggregator with on-chain quotes, slippage/price-impact safeguards, transaction construction/signing, expiry, and confirmation. Current swap is explicitly a sample quote preview and cannot complete a swap.
- **WalletConnect:** test pairing/session approval with a controlled real dApp and relay; validate supported CAIP-2 chain IDs and message encoding. Transaction/typed-data signing remains disabled until reviewed. Investigate the large WalletConnect server bundle noted in Render logs.
- **Transaction history:** connect a trusted indexer and reconcile the app's local session records with on-chain data. The current activity screen shows only real hashes recorded in this session; it is not full historical chain history.
- **Balance/account consistency:** avoid showing estimated USD prices as facts, use integer/base-unit or precise decimal arithmetic for signing values, and ensure UI fees match what the signer actually constructs and broadcasts.

## P1 — database and merchant/payments backend

- **Atomic wallet/account creation:** client server code now calls a proposed atomic RPC; this will not work on the live DB until the migration is reviewed/applied in a controlled deployment and typed client verified against the actual schema.
- **Server-side ledger posting:** migration 11 is only a proposal. In particular, ledger posting must occur after a trusted transaction verifier proves chain confirmation; an untrusted browser request must never directly create authoritative ledger entries.
- **Merchant API:** not implemented. Before issuing keys, build merchant identity/onboarding, server-side API-key issuance (cryptographically random high entropy), one-time display, hashed-at-rest storage, scoped permissions, environment separation, rotation/revocation, rate limits, idempotency/replay controls, signed webhooks, audit trails, and on-chain payment-status verification. A wallet address or browser response is not proof of payment. Do not use a fake key in downstream apps.
- **Supabase service roles and storage:** configure server secrets only after least-privilege review. Never expose a service-role key to the browser. Storage buckets/policies and KYC file handling remain unbuilt unless there are product requirements for them.

## P2 — polish after verified foundations

- Persist real user preferences and notification settings. Current notification switches are local UI previews; push/email delivery is not connected.
- Add a live network health/status panel, accessible form errors, responsive/touch QA, loading/error/retry states, and clear confirmation/finality copy.
- Implement multi-wallet create/switch UI; existing per-chain wallet derivation is one set of addresses derived from one phrase.
- Replace remaining legacy demo routes/data once feature requirements exist; do not re-introduce fiat deposits, banking, bill pay, staking or NFT transfer claims without their real integrations.
- Add accessibility audit, browser/device matrix, dependency checks, bundle optimization, and localization extraction.

## Preview QA

- Preview: https://royal-chain-wallet-preview.onrender.com
- Branch: `security/tx-hardening-2026-10-14`
- Tests/build must be checked for the latest branch head. Prior green CI runs predate later changes and are not evidence that the current head passes.
- No live migration, live token mint, or real-money transfer was executed as part of this QA work.
