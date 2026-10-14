/**
 * BNB Chain (BSC) service.
 *
 * EVM-compatible: shares address format and validation with Ethereum.
 * Live when VITE_BNB_RPC_URL is set (real eth_getBalance via ethers.js —
 * see rpc/evm-rpc.ts); falls back to deterministic mock data otherwise.
 */
import { isAddress } from "ethers";
import { mockBalance, mockNetworkStatus } from "./mockData";
import type { AssetBalance, NetworkStatus } from "./types";
import { isChainLive, chainEndpoint } from "@/lib/config/chains";
import { getEvmBalance, getEvmBlockNumber, getEvmHealth, requireRpcUrl } from "./rpc/evm-rpc";

export async function getBalance(address: string): Promise<AssetBalance> {
  const priced = mockBalance(address, "BNB");
  if (!isChainLive("bnb")) {
    return { ...priced, amount: 0, usdValue: 0, change24hPct: 0 };
  }

  const rpcUrl = requireRpcUrl(chainEndpoint("bnb"), "BNB Chain");
  const { ether } = await getEvmBalance(rpcUrl, address);
  return { ...priced, amount: ether, usdValue: Number((ether * priced.usdPrice).toFixed(2)) };
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (!isChainLive("bnb")) return mockNetworkStatus("bnb");

  const rpcUrl = requireRpcUrl(chainEndpoint("bnb"), "BNB Chain");
  const [blockNumber, healthy] = await Promise.all([
    getEvmBlockNumber(rpcUrl),
    getEvmHealth(rpcUrl),
  ]);
  return {
    chain: "bnb",
    label: "Mainnet (BSC)",
    blockHeight: blockNumber,
    avgFeeUsd: 0.15,
    congestion: healthy ? "low" : "high",
  };
}

export function isValidAddress(address: string): boolean {
  return isAddress(address.trim());
}

export function explorerUrl(hash: string): string {
  return `https://bscscan.com/tx/${hash}`;
}
