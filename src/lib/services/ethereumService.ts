/**
 * Ethereum chain service.
 *
 * Live when VITE_ETH_RPC_URL is set (real eth_getBalance via ethers.js
 * JsonRpcProvider — see rpc/evm-rpc.ts); falls back to deterministic mock
 * data otherwise. Pricing is still mock-derived even when the balance is
 * live — see solanaService.ts header for why.
 */
import { isAddress } from "ethers";
import { mockBalance, mockNetworkStatus } from "./mockData";
import type { AssetBalance, NetworkStatus } from "./types";
import { isChainLive, chainEndpoint } from "@/lib/config/chains";
import { getEvmBalance, getEvmBlockNumber, getEvmHealth, requireRpcUrl } from "./rpc/evm-rpc";

export async function getBalance(address: string): Promise<AssetBalance> {
  const priced = mockBalance(address, "ETH");
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
