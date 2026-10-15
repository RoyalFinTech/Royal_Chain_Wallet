/**
 * Sample market metadata and shared asset labels.
 *
 * This module must never be used as a source of balances or transaction
 * history. The price values and 24-hour changes are illustrative only.
 * Live balance values come from the chain-specific RPC/indexer services.
 */
import type { AssetMeta, AssetSymbol, ChainId, NetworkStatus } from "./types";

export const ASSET_CATALOG: Record<AssetSymbol, AssetMeta> = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    chain: "bitcoin",
    decimals: 8,
    isToken: false,
    iconGradient: "from-orange-400 to-amber-600",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    chain: "ethereum",
    decimals: 18,
    isToken: false,
    iconGradient: "from-indigo-400 to-violet-600",
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    chain: "bnb",
    decimals: 18,
    isToken: false,
    iconGradient: "from-yellow-400 to-amber-500",
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    chain: "solana",
    decimals: 9,
    isToken: false,
    iconGradient: "from-fuchsia-400 to-purple-600",
  },
  ROY: {
    symbol: "ROY",
    name: "Royal Token",
    chain: "solana",
    decimals: 6,
    isToken: true,
    iconGradient: "from-gold to-amber-500",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    chain: "solana",
    decimals: 6,
    isToken: true,
    iconGradient: "from-emerald-400 to-teal-600",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    chain: "solana",
    decimals: 6,
    isToken: true,
    iconGradient: "from-blue-400 to-sky-600",
  },
};

const BASE_USD_PRICE: Record<AssetSymbol, number> = {
  BTC: 64200,
  ETH: 3180,
  BNB: 572,
  SOL: 148,
  ROY: 0.42,
  USDT: 1,
  USDC: 1,
};

/** Return an illustrative market quote only; it is not a live spot price. */
export function sampleMarketData(symbol: AssetSymbol) {
  return {
    symbol,
    usdPrice: BASE_USD_PRICE[symbol],
    // Historical price movement is not connected, so never manufacture a
    // 24-hour change. The dashboard's separate sample chart is labelled.
    change24hPct: 0,
  };
}

export function mockNetworkStatus(chain: ChainId): NetworkStatus {
  // A missing RPC must not masquerade as a live block height, fee estimate, or
  // congestion signal. Values are zero/neutral and the label signals no data.
  return {
    chain,
    label: "Not connected",
    blockHeight: 0,
    avgFeeUsd: 0,
    congestion: "moderate",
  };
}
