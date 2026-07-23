/**
 * Token registry (Module 7 — Token Architecture).
 *
 * Formalizes ASSET_CATALOG (src/lib/services/mockData.ts) with the extra
 * metadata a real integration needs: token standard, contract/mint
 * address (placeholder until supplied), and whether it's a chain-native
 * asset or a deployed token. Adding a new SPL/ERC-20/BEP-20 token later
 * means adding one entry here — no application logic changes required.
 */
import { getEnv } from "./env";
import { ASSET_CATALOG } from "@/lib/services/mockData";
import type { AssetSymbol } from "@/lib/services/types";

export type TokenStandard = "native" | "spl" | "erc20" | "bep20";

export interface TokenRegistryEntry {
  symbol: AssetSymbol;
  name: string;
  standard: TokenStandard;
  chain: ReturnType<typeof chainOf>;
  decimals: number;
  isNative: boolean;
  /** Env var name holding the mint/contract address, if this is a deployed token. */
  contractEnvVar?: "VITE_ROY_MINT" | "VITE_USDT_MINT" | "VITE_USDC_MINT";
}

function chainOf(symbol: AssetSymbol) {
  return ASSET_CATALOG[symbol].chain;
}

export const TOKEN_REGISTRY: Record<AssetSymbol, TokenRegistryEntry> = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    standard: "native",
    chain: chainOf("BTC"),
    decimals: 8,
    isNative: true,
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    standard: "native",
    chain: chainOf("ETH"),
    decimals: 18,
    isNative: true,
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    standard: "native",
    chain: chainOf("BNB"),
    decimals: 18,
    isNative: true,
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    standard: "native",
    chain: chainOf("SOL"),
    decimals: 9,
    isNative: true,
  },
  ROY: {
    symbol: "ROY",
    name: "Royal Token",
    standard: "spl",
    chain: chainOf("ROY"),
    decimals: 6,
    isNative: false,
    contractEnvVar: "VITE_ROY_MINT",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    standard: "spl",
    chain: chainOf("USDT"),
    decimals: 6,
    isNative: false,
    contractEnvVar: "VITE_USDT_MINT",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    standard: "spl",
    chain: chainOf("USDC"),
    decimals: 6,
    isNative: false,
    contractEnvVar: "VITE_USDC_MINT",
  },
};

export function listTokens(): TokenRegistryEntry[] {
  return Object.values(TOKEN_REGISTRY);
}

/** Resolves a token's on-chain contract/mint address, or undefined if not yet supplied. */
export function tokenContractAddress(symbol: AssetSymbol): string | undefined {
  const envVar = TOKEN_REGISTRY[symbol].contractEnvVar;
  return envVar ? getEnv()[envVar] : undefined;
}

export function isTokenLive(symbol: AssetSymbol): boolean {
  const entry = TOKEN_REGISTRY[symbol];
  return entry.isNative || !!tokenContractAddress(symbol);
}
