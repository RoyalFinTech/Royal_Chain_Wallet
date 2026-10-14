/**
 * Bitcoin chain service. Live balances require the configured Esplora-compatible API.
 * Without it the balance is zero/unavailable; only illustrative price metadata remains.
 */
import { sampleMarketData, mockNetworkStatus } from "./mockData";
import type { AssetBalance, NetworkStatus } from "./types";
import { isChainLive, chainEndpoint } from "@/lib/config/chains";
import {
  getBtcBalance,
  getTipHeight,
  getRecommendedFeeRate,
  requireApiUrl,
} from "./rpc/bitcoin-rpc";

export async function getBalance(address: string): Promise<AssetBalance> {
  const priced = sampleMarketData(address, "BTC");
  if (!isChainLive("bitcoin")) {
    return { ...priced, amount: 0, usdValue: 0, change24hPct: 0 };
  }

  const apiUrl = requireApiUrl(chainEndpoint("bitcoin"));
  const { btc } = await getBtcBalance(apiUrl, address);
  return { ...priced, amount: btc, usdValue: Number((btc * priced.usdPrice).toFixed(2)) };
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (!isChainLive("bitcoin")) return mockNetworkStatus("bitcoin");

  const apiUrl = requireApiUrl(chainEndpoint("bitcoin"));
  const [height, feeRate] = await Promise.all([
    getTipHeight(apiUrl),
    getRecommendedFeeRate(apiUrl),
  ]);
  // Rough sat/vB -> USD/tx estimate assuming a ~140 vByte typical transfer.
  const avgFeeUsd = Number((((feeRate * 140) / 100_000_000) * 64_200).toFixed(2));
  return {
    chain: "bitcoin",
    label: "Mainnet",
    blockHeight: height,
    avgFeeUsd,
    congestion: feeRate > 20 ? "high" : feeRate > 8 ? "moderate" : "low",
  };
}

export function isValidAddress(address: string): boolean {
  // Bech32 (bc1...) or legacy/P2SH (1.../3...) sanity check.
  return /^(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address.trim());
}

export function explorerUrl(hash: string): string {
  return `https://mempool.space/tx/${hash}`;
}
