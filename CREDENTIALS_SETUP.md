# Royal Chain Wallet Credentials Setup

## Overview
Copy the root [.env.example](.env.example) file to a local `.env` file and fill in the values for the services you want to enable.

## 1. Application
- VITE_APP_ENV
  - Optional.
  - Use development, staging, or production.
  - No external provider required.

- VITE_FEATURE_FLAGS
  - Optional.
  - Comma-separated feature flags for enabling experimental functionality.
  - Example: live_rpc,live_pricing,push_notifications

## 2. Supabase
- VITE_SUPABASE_URL
  - Required for the browser app.
  - Create or open a Supabase project at https://app.supabase.com.
  - Copy the project URL from Project Settings → API.

- VITE_SUPABASE_PUBLISHABLE_KEY
  - Required for the browser app.
  - Copy the publishable (anon) key from the Supabase API settings.

- SUPABASE_PUBLISHABLE_KEY
  - Optional fallback for server-side or SSR Supabase initialization.
  - Use this if you need a non-VITE fallback for Supabase client setup.

- SUPABASE_URL
  - Required for server-side and MCP integrations.
  - Use the same Supabase project URL.

- SUPABASE_ANON_KEY
  - Required for MCP user-scoped access.
  - Use the same public anon key.

- SUPABASE_SERVICE_ROLE_KEY
  - Required for admin MCP tools.
  - Obtain from Supabase Dashboard → Project Settings → API → service_role key.
  - Keep this private and never expose it to the browser.

## 3. Database
- SUPABASE_PROJECT_ID
  - Optional.
  - Use the Supabase project reference ID from the project dashboard.

## 4. WalletConnect (Reown)
- VITE_WALLETCONNECT_PROJECT_ID
  - Required for WalletConnect pairing flows.
  - Obtain it from https://cloud.reown.com.

## 5. Bitcoin
- VITE_BTC_API_URL
  - Optional.
  - Use an Esplora-compatible API endpoint such as a public explorer API or your own self-hosted instance.
  - Example: https://mempool.space/api

## 6. Solana
- VITE_SOL_RPC_URL
  - Optional.
  - Use a Solana JSON-RPC endpoint from Helius, QuickNode, Alchemy, Triton, or your own node.
  - Example provider: https://www.helius.dev

## 7. Ethereum / BNB / Polygon / Base
- VITE_ETH_RPC_URL
  - Optional.
  - Ethereum Mainnet RPC from Alchemy, Infura, QuickNode, or your own node.

- VITE_BNB_RPC_URL
  - Optional.
  - BNB Smart Chain RPC from Ankr, QuickNode, or your own node.

- VITE_POLYGON_RPC_URL
  - Optional.
  - Polygon RPC from Alchemy, Infura, QuickNode, or your own node.

- VITE_BASE_RPC_URL
  - Optional.
  - Base RPC from Alchemy, Infura, QuickNode, or your own node.

## 8. API Services
- VITE_API_BASE_URL
  - Optional.
  - Only needed if you are running a custom backend for Royal Chain Wallet.

- VITE_ROY_MINT
  - Optional.
  - Supply the Royal Chain token mint or contract address if you want token-specific flows wired to live addresses.

- VITE_USDT_MINT
  - Optional.
  - Supply the USDT contract or mint address if you use live token metadata.

- VITE_USDC_MINT
  - Optional.
  - Supply the USDC contract or mint address if you use live token metadata.

- VITE_PRICE_PROVIDER_URL
  - Optional.
  - Use your pricing provider endpoint if you want live market prices.

- VITE_PRICE_PROVIDER_API_KEY
  - Optional.
  - Use the API key from your pricing provider account.

## 9. Push Notifications
- VITE_FIREBASE_API_KEY
  - Optional.
  - Obtain from Firebase project settings.

- VITE_FIREBASE_PROJECT_ID
  - Optional.
  - Obtain from Firebase project settings.

- VITE_FIREBASE_SENDER_ID
  - Optional.
  - Obtain from Firebase project settings.

- VITE_FIREBASE_APP_ID
  - Optional.
  - Obtain from Firebase project settings.

## 10. Security notes
- Keep all service-role and private keys in `.env` only.
- Do not commit `.env` to source control.
- The app is designed to fall back to mock data when live credentials are not configured.

## Mandatory variables before the app can run
The app can still start in a mock-data mode, but the following values are required for the main live integrations to function:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_URL
- SUPABASE_ANON_KEY
- VITE_WALLETCONNECT_PROJECT_ID

The following are required for the MCP admin tools to operate:
- SUPABASE_SERVICE_ROLE_KEY
