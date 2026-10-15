# Merchant API Readiness — Royal Chain Wallet

## Current status

**No production merchant API key exists. Merchant checkout is not implemented.** Do not paste a placeholder key into partner apps and do not treat a browser response or wallet address as proof of payment.

The wallet currently derives local non-custodial addresses for Bitcoin, Ethereum, BNB Chain and Solana. A crypto address can receive on-chain funds, but the app has no public merchant authorization, invoice, verified payment-status callback or settlement API.

## Proposed integration shape

1. A merchant is onboarded and verified on the server; each environment (sandbox vs production) gets a separate merchant identity.
2. An administrator creates a high-entropy API key server-side. Show the raw key once; store only a strong one-way hash plus key prefix, merchant id, environment, scopes, creation time, expiry and revocation metadata. Never store or display the raw key again.
3. The merchant backend calls Royal's API over HTTPS with an Authorization header. Keys are never sent to browser/mobile code, source repositories, analytics, URL query strings or logs.
4. The API creates an idempotent invoice/payment intent containing amount, asset, chain, destination, expiry, webhook URL and a server-generated reference. For on-chain payments the server tracks the correct network and verifies the actual transaction, recipient, amount/token mint, confirmations/finality and replay/duplicate handling.
5. A signed webhook announces state transitions (for example `created`, `seen`, `confirmed`, `expired`, `underpaid`, `overpaid`, `failed`). Merchants verify the webhook signature and timestamp, deduplicate the event id, and confirm status against a server-side API read. No webhook is sent as paid just because a wallet requested a transfer.
6. Logs record merchant, key id, invoice id, idempotency key, decision, and result without storing the API key, recovery phrase or private keys. Keys need scoped permissions, rate limits, rotation, instant revocation, abuse monitoring and audit history.

## Required backend before issuing live credentials

- Merchant table / onboarding flow with verified ownership and a server-enforced permission model.
- Dedicated key issuance/verification/revocation service; random key generation, hashed-at-rest storage, key prefix, scopes, expiry/rotation and audit events.
- Rate limiting, request signing or replay protection as appropriate, idempotency-key enforcement and safe error handling.
- Invoice/payment-intent model and chain-specific payment verification/indexing; token mints/contracts must be allowlisted and matched exactly.
- Signed webhooks with retries, deduplication, endpoint verification, secret rotation and merchant-configured callback controls.
- Sandbox environment and fixtures, integration tests for wrong chain/address/amount/token, duplicate tx, reorg/unconfirmed tx, expiration, replay, webhook spoofing and secret revocation.
- Security review and deployment of secrets only into a backend secret manager. No service-role key or signing secret may enter a browser bundle.

## Not connected today

There is no merchant issuance endpoint, invoice endpoint, API-key table, webhook implementation, payment status service or verified on-chain settlement callback in this branch. These require a separate backend implementation and review. The current transaction recording endpoint fails closed while chain-verifier integration is absent.

**Recommendation:** build and test a sandbox merchant API first. Generate the production key only after the server implementation is deployed, merchant scopes/rotation are tested, and payment confirmations can be proven independently of the client.
