/**
 * Chain registry — the single source of truth for which networks Royal
 * Chain Wallet supports and how to reach them. RPC URLs are env-driven
 * placeholders; nothing here hardcodes a live endpoint.
 */
import { getEnv, isConfigured } from "./env";
import type { ChainId } from "@/lib/wallet/derive";

export interface ChainConfig {
  id: ChainId;
  name: string;
  isPrimary: boolean;
  nativeSymbol: string;
  decimals: number;
  derivationPath: string;
  explorerTxUrl: (hash: string) => string;
  /** Env var name holding the RPC/API endpoint for this chain (not the value itself). */
  rpcEnvVar: "VITE_SOL_RPC_URL" | "VITE_ETH_RPC_URL" | "VITE_BNB_RPC_URL" | "VITE_BTC_API_URL";
}

export const CHAIN_REGISTRY: Record<ChainId, ChainConfig> = {
  solana: {
    id: "solana",
    name: "Solana",
    isPrimary: true,
    nativeSymbol: "SOL",
    decimals: 9,
    derivationPath: "m/44'/501'/0'/0'",
    explorerTxUrl: (hash) => `https://solscan.io/tx/${hash}`,
    rpcEnvVar: "VITE_SOL_RPC_URL",
  },
  bitcoin: {
    id: "bitcoin",
    name: "Bitcoin",
    isPrimary: false,
    nativeSymbol: "BTC",
    decimals: 8,
    derivationPath: "m/44'/0'/0'/0/0",
    explorerTxUrl: (hash) => `https://mempool.space/tx/${hash}`,
    rpcEnvVar: "VITE_BTC_API_URL",
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    isPrimary: false,
    nativeSymbol: "ETH",
    decimals: 18,
    derivationPath: "m/44'/60'/0'/0/0",
    explorerTxUrl: (hash) => `https://etherscan.io/tx/${hash}`,
    rpcEnvVar: "VITE_ETH_RPC_URL",
  },
  bnb: {
    id: "bnb",
    name: "BNB Smart Chain",
    isPrimary: false,
    nativeSymbol: "BNB",
    decimals: 18,
    derivationPath: "m/44'/60'/0'/0/0", // EVM-compatible, shares the ETH path/address
    explorerTxUrl: (hash) => `https://bscscan.com/tx/${hash}`,
    rpcEnvVar: "VITE_BNB_RPC_URL",
  },
};

export function primaryChain(): ChainConfig {
  return CHAIN_REGISTRY.solana;
}

export function listChains(): ChainConfig[] {
  return Object.values(CHAIN_REGISTRY);
}

/** Whether a chain has a real RPC/API endpoint configured yet. */
export function isChainLive(chain: ChainId): boolean {
  return isConfigured(CHAIN_REGISTRY[chain].rpcEnvVar);
}

/** Resolves the configured endpoint for a chain, or undefined if unset. */
export function chainEndpoint(chain: ChainId): string | undefined {
  return getEnv()[CHAIN_REGISTRY[chain].rpcEnvVar];
}
