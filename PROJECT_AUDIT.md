# Royal Chain Wallet — Engineering Audit

## Scope
This audit reviews the repository contents that were present in the provided archive bundle, focusing on architecture, implementation maturity, verification status, and highest-priority next steps. No application source files were modified during this audit.

## Verified facts
- The project is a Vite + React + TanStack Start application with TypeScript.
- The package manifest defines a browser-first wallet app with blockchain-related dependencies for Bitcoin, Ethereum, Solana, Supabase, WalletConnect, and React Query.
- The app includes route-based UI for wallet creation/import, auth, wallet management, walletconnect, staking, settings, admin, and legal screens.
- There is a dedicated Supabase integration layer and typed database models.
- There is real blockchain service logic for Bitcoin, Ethereum, BNB, and Solana, with env-gated live RPC/API usage and fallback mock data.
- There is a custom Solana transaction wire serializer and EVM/Bitcoin transaction send flows.
- The project includes a local encrypted wallet-storage layer using PIN-derived AES-GCM encryption.
- Unit tests exist and passed during the audit run.
- Type checking completed cleanly.
- ESLint reported 10 warnings and 0 errors.
- Production build completed successfully.

## Assumptions
- The repository archive is the full project content available for audit.
- The environment used for this audit did not include live Supabase credentials, blockchain RPC credentials, or network access to external services.
- The audit is based on static inspection and execution of local verification commands only.

## 1. Frontend framework and architecture
- Framework: React 19 with Vite and TanStack Start.
- Routing: TanStack Router with generated route tree and route modules under src/routes.
- UI: component-based React UI with utility components, Tailwind styling, and Radix UI primitives.
- Architecture style: route-driven app with domain service modules under src/lib and integration adapters under src/integrations.
- Rendering model: likely SSR/edge-compatible due to TanStack Start and server entry wrapper.

## 2. Backend architecture
- The repository is mostly a frontend wallet app with server-side entry points and lightweight server wrappers under src/server.ts and src/start.ts.
- There is a separate MCP server under mcp-server/ for tooling and integrations.
- There is no large standalone backend service in the traditional sense; instead, the app uses Supabase client integration and server-side wrappers for SSR/error handling.

## 3. Database layer
- The project uses Supabase as the database/auth integration layer.
- Typed database interfaces and models exist under src/lib/db/.
- SQL migrations are present under supabase/migrations/.
- The code clearly distinguishes between typed client usage and the platform-generated Supabase client.
- Important caveat: the audit did not verify that the migrations were applied to a live Supabase project, and the code explicitly treats the schema as not yet fully available in runtime environments.

## 4. Authentication flow
- Authentication is designed around Supabase Auth.
- The implementation uses real Supabase auth methods for sign-up, sign-in, sign-out, and password reset.
- Session handling is client-side and local-storage-based for idle timeout and activity tracking.
- Wallet unlock is PIN-based and local-device-only; the mnemonic is decrypted locally and never sent to a backend.
- Biometrics and device trust hooks exist but are not fully verified as production-ready.

## 5. Blockchain integrations
### Bitcoin
- Real-looking service and RPC modules exist.
- The app can use Esplora-compatible REST APIs via env-driven configuration.
- Transaction sending and PSBT signing logic are implemented with bitcoinjs-lib.
- Broadcast paths exist but were not verified against live networks.

### Ethereum / BNB
- EVM services use ethers.js for balance querying and transaction sending.
- RPC configuration is env-driven.
- Broadcast/signing paths are present but not live-tested.

### Solana
- Solana balance and RPC modules exist.
- Native SOL transfer signing and serialization are implemented without @solana/web3.js, using custom wire-format logic.
- Unit tests cover the wire format and signature verification.
- Live broadcast against devnet/mainnet was not verified in this environment.

### WalletConnect
- The app includes a wallet-side WalletConnect integration via Reown WalletKit and a session manager.
- The UI and signing flow are present.
- Live relay and dapp interoperability were not verified here.

## 6. API structure
- There is a shared API client layer under src/lib/api/.
- The app uses typed endpoints and service modules rather than a single monolithic API layer.
- Some functionality is implemented through server wrappers and Supabase integration rather than a custom REST backend.

## 7. State management
- TanStack Query is used for async data handling.
- Router context includes a query client.
- Local component state is used throughout the UI.
- Wallet state is handled through custom hooks and local encrypted storage.

## 8. Build system
- Build tool: Vite.
- Package manager: npm (package-lock present).
- TypeScript support enabled.
- Vitest used for unit tests.
- ESLint and Prettier configured.

## 9. Environment variables
- Env handling is centralized in src/lib/config/env.ts.
- .env.example lists Supabase, blockchain RPC, WalletConnect, token contract, API, pricing, feature-flag, and app metadata variables.
- The code is designed to gracefully fall back to mock data when live env vars are not configured.

## 10. Testing setup
- Unit tests exist under tests/unit/.
- Test execution recorded 23 passing tests.
- The test environment is Node-based, and the suite covers wallet derivation, permissions, encryption, currencies, and Solana wire serialization.

## 11. CI/CD configuration
- No CI/CD workflow files were found in the extracted repository contents.
- There is no evidence of GitHub Actions, Azure Pipelines, or similar automation in the inspected tree.

## What is fully implemented
- Core app shell and route structure.
- Wallet creation/import UX and local encrypted wallet storage.
- Multi-chain wallet address derivation and support for multiple assets.
- Deterministic mock data paths for blockchain balances and transactions.
- Supabase auth integration scaffolding and typed database models.
- WalletConnect UI and session-management hooks.
- Unit tests and build pipeline.

## What is partially implemented
- Live blockchain networking is present but depends on real env configuration and external endpoints.
- Supabase integration is present, but live database connectivity and audited production policies were not verified.
- WalletConnect is wired at the code level but not validated against a real relay/dapp pair.
- Some features are clearly marked as “future” or “not yet wired” in comments and docs rather than code TODO markers.

## What is placeholder or mock code
- The default experience relies heavily on deterministic mock data when live RPC/API/env values are not present.
- Pricing and some transaction data are still mock-derived even when blockchain balances are fetched live.
- The app’s “live” features are intentionally gated and often default to mock behavior unless configured.

## What is missing or high-risk
- No verified live deployment or integration with real Supabase data.
- No verified live testnet/mainnet blockchain broadcasts.
- No visible CI/CD automation.
- No evidence of production-grade RLS/policies or storage bucket setup being verified.
- WalletConnect live behavior remains unverified.
- Real token transfers beyond native assets are not fully wired according to project docs.

## Security review highlights
- No hardcoded secrets were found in the inspected source tree.
- The code uses env vars for external services instead of embedding credentials.
- Local encryption and PIN handling are implemented on-device.
- The app intentionally avoids sending private keys or mnemonics to servers.
- Risks remain around unverified live integrations, permission boundaries, and the need for formal review of production database policies and transaction paths.

## Verification commands executed
- npm ci
- npm run typecheck
- npm run lint
- npm run test
- npm run build

## Command results
- Typecheck: passed with no diagnostics.
- Lint: 0 errors, 10 warnings.
- Tests: 23/23 passing.
- Build: succeeded.

## Highest-priority next tasks
1. Provision real Supabase credentials and apply the migrations to a real project; verify authentication and table access end-to-end.
2. Configure real RPC/API endpoints for Bitcoin, Ethereum, BNB, and Solana; verify live balance and transaction flows on testnet/devnet first.
3. Test Solana and Bitcoin signing paths against a test network before any mainnet use.
4. Add CI/CD automation for install, typecheck, lint, tests, and production build.
5. Validate WalletConnect against a live dapp and relay environment.
6. Review and implement production security controls for Supabase RLS, storage policies, and audit logging.
