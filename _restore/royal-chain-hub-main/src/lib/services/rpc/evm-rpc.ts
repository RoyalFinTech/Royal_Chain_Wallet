/**
 * Real EVM JSON-RPC client (Priority 3).
 * Shared by Ethereum, BNB Smart Chain, Polygon, and Base — all
 * EVM-compatible, all speak the same eth_* JSON-RPC methods, and (per
 * lib/config/evm-networks.ts) all resolve to the wallet's single
 * Ethereum-derived address, exactly like MetaMask/Trust Wallet do when
 * you switch networks without switching accounts.
 */
import { JsonRpcProvider, formatEther } from "ethers";
import { NotConfiguredError } from "@/lib/errors/types";

export interface EvmBalanceResult {
  wei: string;
  ether: number;
}

function provider(rpcUrl: string): JsonRpcProvider {
  return new JsonRpcProvider(rpcUrl);
}

export async function getEvmBalance(rpcUrl: string, address: string): Promise<EvmBalanceResult> {
  const bal = await provider(rpcUrl).getBalance(address);
  return { wei: bal.toString(), ether: Number(formatEther(bal)) };
}

export async function getEvmTransactionCount(rpcUrl: string, address: string): Promise<number> {
  return provider(rpcUrl).getTransactionCount(address);
}

export async function getEvmBlockNumber(rpcUrl: string): Promise<number> {
  return provider(rpcUrl).getBlockNumber();
}

export async function getEvmGasPrice(rpcUrl: string): Promise<bigint> {
  const feeData = await provider(rpcUrl).getFeeData();
  return feeData.gasPrice ?? 0n;
}

export async function getEvmHealth(rpcUrl: string): Promise<boolean> {
  try {
    await provider(rpcUrl).getBlockNumber();
    return true;
  } catch {
    return false;
  }
}

export function requireRpcUrl(rpcUrl: string | undefined, chainName: string): string {
  if (!rpcUrl) throw new NotConfiguredError(`${chainName} RPC`);
  return rpcUrl;
}
