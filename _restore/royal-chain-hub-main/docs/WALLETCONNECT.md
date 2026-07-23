# WalletConnect (Reown) Integration — Phase 10

## What this is

Royal Chain Wallet now implements the WALLET side of WalletConnect using
`@reown/walletkit` (the successor to `@walletconnect/web3wallet`) — this
lets external dapps (browser or mobile) pair with Royal Chain Wallet via
a WC URI or QR code, request session approval, and request
transactions/signatures, which the user approves with their PIN through
the existing on-device signing path (`lib/wallet/signing.ts`) — nothing
about the non-custodial architecture changes.

- **Code:** `src/lib/walletconnect/` (`client.ts`, `chains.ts`,
  `session-manager.ts`), UI at `src/routes/app.walletconnect.tsx`,
  entry point from the Ecosystem page.
- **Supported chains:** Ethereum, BNB Smart Chain, Polygon, Base
  (all EVM, share the wallet's Ethereum address), and Solana. **Bitcoin
  is not included** — there's no standardized, widely-adopted
  WalletConnect namespace for it.

## Confidence level — please read before relying on this in production

This was built from my knowledge of the WalletKit API surface (the
`session_proposal`/`session_request` event shape, and the
`pair`/`approveSession`/`rejectSession`/`respondSessionRequest` methods),
which has been stable across `@walletconnect/web3wallet` and its
`@reown/walletkit` successor. It **typechecks correctly against the real
installed SDK** (`node_modules/@reown/walletkit`), which caught and fixed
several real type errors during development. What it has **not** been
tested against, because this environment has no network access to
WalletConnect's relay servers:

- An actual pairing handshake with a real dapp
- A real session proposal/approval round-trip
- A real signing request end-to-end

The two things most likely to need adjustment once you test against a
real dapp:
1. **Solana CAIP-2 chain references** (`chains.ts`) — I used the
   shorthand `solana:mainnet`/`solana:devnet` convention documented in
   several integration guides, not a genesis-hash-based reference. Some
   dapps may expect the latter. Verify against current Reown docs.
2. **Transaction parameter parsing** (`extractTxFromParams` in
   `session-manager.ts`) — the hex-wei-to-ether conversion is a
   simplified placeholder; a production implementation needs to handle
   the full `eth_sendTransaction` parameter shape (gas, data, nonce
   overrides) properly, and the equivalent for `solana_signTransaction`
   (which takes a serialized transaction, not a simple to/value pair)
   is not implemented at all — right now only simple native transfers
   route correctly.

## Known operational concern: bundle size

`@reown/walletkit` added **2.6MB (641KB gzipped)** to the server bundle
during the Phase 10 build, despite every import in `lib/walletconnect/`
being a dynamic `await import()` gated behind client-only checks. I
tried excluding it via Vite's `ssr.external` config — it had no effect,
likely because Nitro's Cloudflare Workers bundling pass does its own
dependency resolution independent of that setting. The build **succeeds**
(no hard failure like the earlier `@solana/web3.js` incident would have
caused), but Cloudflare Workers has script size limits that vary by plan,
and this is worth checking against your actual deployment before
shipping. I did not find a working fix for this from within this
environment; I'd want to test different bundling approaches against a
real `wrangler deploy` to solve it properly rather than guess further.

## Testing checklist (requires deployment and credentials)

- [ ] Set `VITE_WALLETCONNECT_PROJECT_ID` from https://cloud.reown.com
- [ ] Deploy the app somewhere with real network access
- [ ] From a test dapp (e.g. the WalletConnect example dapp, or any dapp
      with "Connect Wallet"), copy the WC URI and paste it into
      `/app/walletconnect`
- [ ] Confirm the session proposal actually appears and shows the
      correct dapp name/URL
- [ ] Approve it, confirm the dapp sees the wallet's real addresses
- [ ] Trigger a `personal_sign` request from the dapp, confirm the PIN
      prompt appears and the signature round-trips correctly
- [ ] Trigger a testnet `eth_sendTransaction`, confirm it actually
      broadcasts (this exercises the same signing path as the regular
      Send flow, so Phase 9's testnet-testing requirement covers this too)
- [ ] Check actual deployed Cloudflare Workers bundle size against your
      plan's limit
