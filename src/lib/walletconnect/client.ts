/**
 * Reown WalletKit client — the wallet side of WalletConnect.
 *
 * Royal Chain Wallet is a WALLET, not a dapp: this uses @reown/walletkit
 * (the successor to @walletconnect/web3wallet), which lets a wallet app
 * pair with dapps via a WC URI/QR code, approve session proposals, and
 * respond to signing requests — the opposite direction from @reown/appkit,
 * which is for dapps connecting TO wallets.
 *
 * CLIENT-ONLY, deliberately: WalletKit opens a WebSocket to WalletConnect's
 * relay network at init time. Importing it at module scope anywhere
 * reachable from the SSR bundle risks repeating the exact bundling
 * failure this project hit with @solana/web3.js's Connection class
 * (see solanaService.ts). Every export here is a function that
 * dynamically imports the SDK — nothing executes until called from a
 * browser context.
 */
import { isConfigured, getEnv } from "@/lib/config/env";

export function isWalletConnectConfigured(): boolean {
  return isConfigured("VITE_WALLETCONNECT_PROJECT_ID");
}

let initPromise: ReturnType<typeof initWalletKit> | null = null;

async function initWalletKit() {
  const { Core } = await import("@walletconnect/core");
  const { WalletKit } = await import("@reown/walletkit");

  const projectId = getEnv().VITE_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    const { NotConfiguredError } = await import("@/lib/errors/types");
    throw new NotConfiguredError("WalletConnect (VITE_WALLETCONNECT_PROJECT_ID)");
  }

  const core = new Core({ projectId });
  return WalletKit.init({
    core,
    metadata: {
      name: "Royal Chain Wallet",
      description: "Non-custodial multi-chain wallet by Royal FinTech Company",
      url: typeof window !== "undefined" ? window.location.origin : "https://royalchainwallet.com",
      icons: ["/icon-512.png"],
    },
  });
}

/**
 * Lazily initializes (once) and returns the WalletKit instance. Throws
 * NotConfiguredError if VITE_WALLETCONNECT_PROJECT_ID isn't set — callers
 * should check isWalletConnectConfigured() first for a friendlier UI
 * state, same pattern as every other live-service gate in this codebase.
 */
export async function getWalletKit() {
  if (typeof window === "undefined") {
    throw new Error("WalletKit is client-only and cannot be initialized during SSR.");
  }
  if (!initPromise) initPromise = initWalletKit();
  return initPromise;
}
