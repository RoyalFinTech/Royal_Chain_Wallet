/**
 * Mock blockchain providers (Module 12).
 *
 * Implements the ChainAdapter contract (src/lib/services/chain-adapter.ts)
 * with fully deterministic, no-network responses — for unit/integration
 * tests that need "a chain" without hitting real RPC or even the
 * seeded-random mock data services.
 */
import type { ChainAdapter, HealthCheckResult } from "@/lib/services/chain-adapter";
import type { AssetBalance, NetworkStatus } from "@/lib/services/types";
import { CHAIN_REGISTRY } from "@/lib/config/chains";
import type { ChainId } from "@/lib/wallet/derive";

export function createMockChainAdapter(
  chain: ChainId,
  overrides?: Partial<ChainAdapter>,
): ChainAdapter {
  const config = CHAIN_REGISTRY[chain];
  const base: ChainAdapter = {
    config,
    async getNetworkStatus(): Promise<NetworkStatus> {
      return { chain, label: "Mock Testnet", blockHeight: 1, avgFeeUsd: 0.01, congestion: "low" };
    },
    async getBalance(): Promise<AssetBalance> {
      return {
        symbol: config.nativeSymbol as AssetBalance["symbol"],
        amount: 1,
        usdPrice: 100,
        usdValue: 100,
        change24hPct: 0,
      };
    },
    isValidAddress(): boolean {
      return true;
    },
    explorerTxUrl(hash: string): string {
      return `https://mock-explorer.test/tx/${hash}`;
    },
    async healthCheck(): Promise<HealthCheckResult> {
      return { chain, healthy: true, latencyMs: 1, usingLiveRpc: false };
    },
  };
  return { ...base, ...overrides };
}
