/**
 * Ethereum chain service. Balance reads require the configured EVM RPC.
 * Price metadata is an illustrative estimate until a live market feed exists.
 */
import { isAddress } from "ethers";
import { sampleMarketData, mockNetworkStatus } from "./mockData";
import type { AssetBalance, NetworkStatus } from "./types";
import { isChainLive, chainEndpoint } from "@/lib/config/chains";
import { getEvmBalance, getEvmBlockNumber, getEvmHealth, requireRpcUrl } from "./rpc/evm-rpc";

export async function getBalance(address: string): Promise<AssetBalance> {
  const priced = sampleMarketData(address, "ETH");
  if (!isChainLive("ethereum")) {
    return { ...priced, amount: 0, usdValue: 0, change24hPct: 0 };
  }

  const rpcUrl = requireRpcUrl(chainEndpoint("ethereum"), "Ethereum");
  const { ether } = await getEvmBalance(rpcUrl, address);
  return { ...priced, amount: ether, usdValue: Number((ether * priced.usdPrice).toFixed(2)) };
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (!isChainLive("ethereum")) return mockNetworkStatus("ethereum");

  const rpcUrl = requireRpcUrl(chainEndpoint("ethereum"), "Ethereum");
  const [blockNumber, healthy] = await Promise.all([
    getEvmBlockNumber(rpcUrl),
    getEvmHealth(rpcUrl),
  ]);
  return {
    chain: "ethereum",
    label: "Mainnet",
    blockHeight: blockNumber,
    avgFeeUsd: 2.5,
    congestion: healthy ? "moderate" : "high",
  };
}

export function isValidAddress(address: string): boolean {
  return isAddress(address.trim());
}

export function explorerUrl(hash: string): string {
  return `https://etherscan.io/tx/${hash}`;
}
