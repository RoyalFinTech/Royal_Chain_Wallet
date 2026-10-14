# Next Steps

Last updated: 2026-10-14. Status is based on direct repository inspection and read-only checks of the connected services.

## Phase A — Protect recovery phrases first

1. **In progress:** Fix the create-wallet preview so mnemonic and derived addresses are generated in memory only. Do not persist until the user sets and confirms their own PIN.
2. **In progress:** Remove the default `royal-chain` import PIN; require a new user-chosen PIN when restoring a valid BIP-39 phrase.
3. Clear temporary PIN/recovery-phrase state after secure persistence and when the user exits/times out.
4. Replace the partial mock phrase wordlist with the installed BIP-39 English wordlist and preserve checksum validation.
5. Disable backup-file/private-key imports that are still simulated; do not claim restore success without decoding and verifying the real input.
6. Remove static demo address/identity from real-wallet screens and real receive payloads. Show honest demo/no-wallet states if no wallet exists.

## Phase B — Make WalletConnect/scanning safe

1. Implement a real camera-backed QR decoder using feature detection/permission handling and a manual fallback; return scanned WalletConnect URIs to the WalletConnect page instead of the simulated merchant flow.
2. Keep the WalletConnect project ID client-exposed only (it is a public project identifier, not a secret); do not ship server-side/secret API values with a `VITE_` prefix.
3. Reject or hide unsupported `eth_sendTransaction`, `eth_signTypedData_v4`, and `solana_signTransaction` actions until full request-byte validation/chain-specific signing exists. Never translate a dapp request into a different native transfer.
4. Add clear dapp/chain/method/decoded payload confirmation and re-check address/chain before signing.
5. Write tests for QR URI validation, BIP-39 import, supported/unsupported WalletConnect methods, and transaction-parameter decoding.
6. Test pairing/session proposals only after setting the project ID on a preview environment. Use no real funds; test transaction requests with testnet/devnet wallets.

## Phase C — Reconcile Supabase migration history

1. Recover the source SQL for already-applied migrations #5–#10 into the repository from project history/version control.
2. Rename the proposed security migration to a new unique sequence after #10 and review the full diff.
3. Decide/fix live rate-limit RPC security and reconcile the transaction RPC ACL with the chosen call path.
4. Apply a candidate migration only to a disposable Supabase branch/local database first; test auth/profile mapping, RLS cross-user reads/writes, transaction integrity and rate-limit concurrency.
5. After validation, run the Supabase security and performance advisors; document each finding and disposition.
6. Only then request approval for any production migration.

## Phase D — Render preview

1. Confirm TanStack Start/Nitro build output and the Node-compatible run command. The repo currently has no `start` script; the default config is Cloudflare-oriented.
2. Create a separate **staging/preview** web service in **Royal's workspace**, connected only to this repository and a QA branch. Do not change the three unrelated services.
3. Use only required variables for the preview: Supabase project URL, publishable key, and WalletConnect project ID as applicable. All chain RPC values are optional until testnet coverage is ready.
4. Ask the user to enter actual secrets directly in Render Dashboard/Environment (or use the connected Render secret update tool with values supplied through a secure channel). Do not paste service-role keys, wallet mnemonics, private keys, or other secrets into chat, logs, git, or a VITE-prefixed variable.
5. Verify deploy status, root-page response, server logs, and QR/camera functionality; record the deployed branch/commit/service URL here and in the engineering log.

## Exit criteria before a production claim

- [ ] Wallet create never persists before PIN choice; import never uses shared/default PIN.
- [ ] Standard BIP-39 12- and 24-word generation/import tested; bad checksum and invalid words rejected.
- [ ] No static fake wallet identity/address presented as the user's live wallet.
- [ ] QR scanner actually reads QR codes and handles denied camera permission.
- [ ] WalletConnect transaction requests that are not correctly supported are rejected without broadcasting anything.
- [ ] Repository migration history is reproducible and candidate SQL tested in disposable Supabase.
- [ ] Rate limiting has identity binding, fixed quotas, safe ACLs and concurrency tests.
- [ ] `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` run successfully and results are recorded.
- [ ] Preview deploy is live and smoke-tested in Royal's workspace; production still requires separate approval.
