/**
 * Additional EVM networks (Priority 3 — Polygon, Base).
 *
 * These are NOT new entries in ChainId/DerivedAddresses — Polygon and
 * Base are EVM-compatible networks that use the exact same
 * secp256k1-derived address as Ethereum (same curve, same derivation
 * path), the same way MetaMask shows one address across every EVM
 * network you add. Extending ChainId would have meant threading two new
 * values through wallet derivation, storage, and every screen that lists
 * "the 4 chains" — unnecessary churn for what is really just "Ethereum,
 * pointed at a different RPC." This lightweight registry captures that
 * correctly instead.
 */
import { getEnv, isConfigured } from "./env";

export type EvmNetworkId = "ethereum" | "bnb" | "polygon" | "base";

export interface EvmNetworkConfig {
  id: EvmNetworkId;
  name: string;
  nativeSymbol: string;
  chainIdHex: string; // EIP-155 chain id
  explorerTxUrl: (hash: string) => string;
  rpcEnvVar: "VITE_ETH_RPC_URL" | "VITE_BNB_RPC_URL" | "VITE_POLYGON_RPC_URL" | "VITE_BASE_RPC_URL";
}

export const EVM_NETWORKS: Record<EvmNetworkId, EvmNetworkConfig> = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    nativeSymbol: "ETH",
    chainIdHex: "0x1",
    explorerTxUrl: (h) => `https://etherscan.io/tx/${h}`,
    rpcEnvVar: "VITE_ETH_RPC_URL",
  },
  bnb: {
    id: "bnb",
    name: "BNB Smart Chain",
    nativeSymbol: "BNB",
    chainIdHex: "0x38",
    explorerTxUrl: (h) => `https://bscscan.com/tx/${h}`,
    rpcEnvVar: "VITE_BNB_RPC_URL",
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    nativeSymbol: "POL",
    chainIdHex: "0x89",
    explorerTxUrl: (h) => `https://polygonscan.com/tx/${h}`,
    rpcEnvVar: "VITE_POLYGON_RPC_URL",
  },
  base: {
    id: "base",
    name: "Base",
    nativeSymbol: "ETH",
    chainIdHex: "0x2105",
    explorerTxUrl: (h) => `https://basescan.org/tx/${h}`,
    rpcEnvVar: "VITE_BASE_RPC_URL",
  },
};

export function listEvmNetworks(): EvmNetworkConfig[] {
  return Object.values(EVM_NETWORKS);
}

export function isEvmNetworkLive(network: EvmNetworkId): boolean {
  return isConfigured(EVM_NETWORKS[network].rpcEnvVar);
}

export function evmNetworkEndpoint(network: EvmNetworkId): string | undefined {
  return getEnv()[EVM_NETWORKS[network].rpcEnvVar];
}
