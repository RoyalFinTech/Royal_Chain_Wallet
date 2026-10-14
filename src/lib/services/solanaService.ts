/**
 * Solana chain service. Live balances require the configured Solana RPC.
 * Address handling uses browser/edge-compatible libraries. Price metadata
 * remains an illustrative estimate until a live market feed is connected.
 */
import bs58 from "bs58";
import { sampleMarketData, mockNetworkStatus } from "./mockData";
import type { AssetBalance, NetworkStatus } from "./types";
import { isChainLive, chainEndpoint } from "@/lib/config/chains";
import { getSolBalance, getSlot, getHealth, requireRpcUrl } from "./rpc/solana-rpc";

export async function getBalance(address: string): Promise<AssetBalance> {
  const priced = sampleMarketData(address, "SOL");
  if (!isChainLive("solana")) {
    return { ...priced, amount: 0, usdValue: 0, change24hPct: 0 };
  }

  const rpcUrl = requireRpcUrl(chainEndpoint("solana"), "Solana");
  const { sol } = await getSolBalance(rpcUrl, address);
  return { ...priced, amount: sol, usdValue: Number((sol * priced.usdPrice).toFixed(2)) };
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (!isChainLive("solana")) return mockNetworkStatus("solana");

  const rpcUrl = requireRpcUrl(chainEndpoint("solana"), "Solana");
  const [slot, healthy] = await Promise.all([getSlot(rpcUrl), getHealth(rpcUrl)]);
  return {
    chain: "solana",
    label: "Mainnet Beta",
    blockHeight: slot,
    avgFeeUsd: 0.0008, // Solana fees are near-flat; live fee-market data is a future refinement
    congestion: healthy ? "low" : "high",
  };
}

export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }
  try {
    const decoded = bs58.decode(address.trim());
    return decoded.length === 32;
  } catch {
    return false;
  }
}

export function explorerUrl(hash: string): string {
  return `https://solscan.io/tx/${hash}`;
}
