/**
 * Solana chain service.
 *
 * Live when VITE_SOL_RPC_URL is set (real getBalance/getTokenAccountsByOwner
 * JSON-RPC calls — see rpc/solana-rpc.ts); falls back to deterministic mock
 * data otherwise so the app never crashes on an unconfigured environment.
 * Address handling uses lightweight bs58/tweetnacl (Cloudflare Workers /
 * edge-runtime safe) — intentionally not @solana/web3.js's Connection
 * class, which pulls in a Node-only websocket dependency that breaks edge
 * SSR builds (hit and fixed earlier in this project).
 *
 * Pricing (usdPrice/change24hPct) is still mock-derived even when the
 * balance is live — a live price feed is a separate integration
 * (VITE_PRICE_PROVIDER_URL, see lib/config/currency-preference.ts)
 * outside this phase's scope.
 */
import bs58 from "bs58";
import { mockBalance, mockNetworkStatus } from "./mockData";
import type { AssetBalance, NetworkStatus } from "./types";
import { isChainLive, chainEndpoint } from "@/lib/config/chains";
import { getSolBalance, getSlot, getHealth, requireRpcUrl } from "./rpc/solana-rpc";

export async function getBalance(address: string): Promise<AssetBalance> {
  const priced = mockBalance(address, "SOL"); // price/change still mock — see file header
  if (!isChainLive("solana")) return priced;

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
