/**
 * Shared types for the multi-chain service layer.
 *
 * Every chain/token service implements against these interfaces so the UI
 * never branches on "which chain" beyond picking which service to call.
 * Swapping a service's internals from mock data to a live provider
 * (Solana RPC, an EVM JSON-RPC endpoint, a Bitcoin API/indexer, etc.)
 * never requires touching this file or the UI.
 */

export type ChainId = "bitcoin" | "ethereum" | "bnb" | "solana";

export type AssetSymbol = "BTC" | "ETH" | "BNB" | "SOL" | "ROY" | "USDT" | "USDC";

export interface AssetMeta {
  symbol: AssetSymbol;
  name: string;
  chain: ChainId;
  decimals: number;
  isToken: boolean; // true for ROY / USDT / USDC (SPL tokens on Solana)
  iconGradient: string; // tailwind gradient classes for the asset glyph
}

export interface AssetBalance {
  symbol: AssetSymbol;
  amount: number; // human units, e.g. 0.0421 BTC
  usdValue: number;
  usdPrice: number;
  change24hPct: number;
}

export interface NetworkStatus {
  chain: ChainId;
  label: string; // e.g. "Mainnet"
  blockHeight: number;
  avgFeeUsd: number;
  congestion: "low" | "moderate" | "high";
}

export type TxDirection = "in" | "out";
export type TxStatus = "pending" | "confirmed" | "failed";

export interface TxRecord {
  id: string;
  chain: ChainId;
  symbol: AssetSymbol;
  direction: TxDirection;
  amount: number;
  usdValue: number;
  counterparty: string; // shortened address
  status: TxStatus;
  timestamp: number; // ms epoch
  feeUsd: number;
  hash: string;
}

export interface QuoteResult {
  fromSymbol: AssetSymbol;
  toSymbol: AssetSymbol;
  fromAmount: number;
  toAmount: number;
  rate: number;
  networkFeeUsd: number;
  slippagePct: number;
}

export interface StakeSummary {
  symbol: "SOL" | "ROY";
  staked: number;
  rewards: number;
  apyPct: number;
  unstakingPeriodDays: number;
}
