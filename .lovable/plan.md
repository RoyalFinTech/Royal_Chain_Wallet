# Royal Chain Wallet — TON Blockchain Integration Plan

## ⚠️ Security notice first

You pasted your `TON_API_KEY` directly into chat. Anything sent in chat is visible in history and should be considered exposed. **Please rotate that key at https://tonconsole.com immediately after we're done**, and I'll store the new one via a secure form. For now I can store the pasted value as a starting point, but treat it as burnt.

## Scope reality check

Your prompt covers a full production TON wallet: real key generation, seed phrases, signing, staking, NFTs, Jettons, TON Connect, DEX swaps, DApp browser, multi-chain readiness, biometrics, 2FA, admin backend, 8 languages, real-time push. That's **months** of work, not one turn. I'll build it in focused phases and stop between each so you can test.

I also need to flag: **a real non-custodial wallet that holds user funds is a serious security product.** Seed phrase generation, private key storage, and transaction signing done wrong = users lose money with no recovery. I'll use battle-tested libraries (`@ton/ton`, `@ton/crypto`), keep signing client-side, and never send private keys to the backend — but you should get a proper security audit before real users touch this.

## Phase 1 — Foundation (this turn)

1. **Enable Lovable Cloud** — needed for backend secrets, DB (address book, sessions, settings), and server functions that proxy TonAPI.
2. **Store `TON_API_KEY` securely** as a backend env var (never shipped to frontend).
3. **Add TON libraries**: `@ton/ton`, `@ton/core`, `@ton/crypto`, `tonapi-sdk-js`.
4. **TON service layer** (server functions, key never leaves server):
   - `ton.getAccount(address)` — balance + status
   - `ton.getJettons(address)` — Jetton balances
   - `ton.getNfts(address)` — NFT holdings
   - `ton.getTransactions(address, limit)` — tx history
   - `ton.estimateFee(payload)` — fee preview
   - `ton.sendBoc(boc)` — broadcast signed transaction
   - `ton.validateAddress(addr)` — friendly/raw validation
5. **Client wallet crypto** (`src/lib/ton/wallet.ts`, browser-only):
   - Generate 24-word mnemonic (`@ton/crypto` → `mnemonicNew`)
   - Derive keypair + v4 wallet address
   - Encrypt seed with user PIN (AES-GCM via WebCrypto) → store in IndexedDB
   - Decrypt on unlock, sign transfers with `WalletContractV4`
6. **Wire real data** into Dashboard, Wallet, Receive, Transactions, Send (preview + broadcast). Send flow: PIN → decrypt seed → sign → `sendBoc` → poll status.
7. **Address validation & fee estimate** in Send screen.

## Phase 2 — Wallet lifecycle
- Real Create Wallet flow: generate mnemonic, force user to write it down, verify 3 random words, set PIN.
- Real Import Wallet: validate 12/24-word mnemonic, derive address, encrypt & store.
- Recovery flow, PIN change, wallet export (with warning + re-auth).

## Phase 3 — Jettons & NFTs
- Jetton list + transfer (build Jetton wallet transfer message, sign, broadcast).
- NFT gallery from TonAPI, NFT transfer.

## Phase 4 — QR / Merchant / TON Connect
- TON payment URI parsing (`ton://transfer/...`) for send.
- Merchant QR generation with amount + comment.
- TON Connect v2 SDK integration for DApp sessions.

## Phase 5 — Staking, Swap, DApp browser
- Staking via nominator pool contracts (validator list, deposit, withdraw, claim).
- Swap: STON.fi or DeDust SDK.
- In-app DApp browser (webview-style iframe with TON Connect bridge).

## Phase 6 — Security hardening
- Biometric WebAuthn unlock, auto-lock timer, session management server-side, transaction approval flow, security alerts.

## Phase 7 — Polish
- Real-time balance refresh (polling → WebSocket via TonAPI SSE), price service (CoinGecko for fiat conversion), i18n for 8 languages, hidden admin route wired to Cloud auth + role check.

## Technical notes (for you or a reviewer)

- **Custody model**: non-custodial. Seed encrypted client-side with PIN-derived key (PBKDF2 200k iterations → AES-GCM), stored in IndexedDB. Backend never sees plaintext seed or private key.
- **Backend role**: TonAPI proxy (hides API key, adds rate limiting), address book, user preferences, notifications, price feeds. No signing.
- **Multi-chain**: I'll structure the service layer as `chains/ton/*` so adding EVM/Solana later is additive, not a rewrite. But I will NOT scaffold empty EVM/Solana modules now — that's dead code.
- **Admin**: hidden `/admin` route already exists; I'll gate it behind Cloud auth + `has_role('admin')` in Phase 7.

## What I'm NOT doing in Phase 1

Staking, swap, NFT transfer, TON Connect, DApp browser, i18n, biometric auth, admin backend, multi-chain — all deferred to later phases. Phase 1 gets you a wallet that can hold real TON, see real balance/transactions, and send real TON. That's the foundation everything else builds on.

Approve to start Phase 1, or tell me what to reorder / cut.
