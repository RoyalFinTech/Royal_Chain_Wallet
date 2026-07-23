/**
 * Blockchain abstraction layer (Module 6).
 *
 * Unifies bitcoinService / ethereumService / bnbService / solanaService
 * behind one ChainAdapter contract, so anything that needs "a chain" can
 * depend on this interface instead of importing four separate modules
 * and branching on chain id. Each concrete service already implements
 * this shape informally; the adapters below just wire them up formally
 * and add the network/health-check surface Module 6 asks for.
 */
import { isConfigured } from "@/lib/config/env";
import { CHAIN_REGISTRY, type ChainConfig } from "@/lib/config/chains";
import type { ChainId } from "@/lib/wallet/derive";
import type { AssetBalance, NetworkStatus } from "./types";
import * as bitcoinService from "./bitcoinService";
import * as ethereumService from "./ethereumService";
import * as bnbService from "./bnbService";
import * as solanaService from "./solanaService";

export interface HealthCheckResult {
  chain: ChainId;
  healthy: boolean;
  latencyMs: number | null;
  usingLiveRpc: boolean;
  message?: string;
}

export interface ChainAdapter {
  readonly config: ChainConfig;
  /** Network interface */
  getNetworkStatus(): Promise<NetworkStatus>;
  /** Balance interface */
  getBalance(address: string): Promise<AssetBalance>;
  /** Transaction interface */
  isValidAddress(address: string): boolean;
  explorerTxUrl(hash: string): string;
  /** Health check interface */
  healthCheck(): Promise<HealthCheckResult>;
}

function makeAdapter(
  chain: ChainId,
  impl: {
    getNetworkStatus: () => Promise<NetworkStatus>;
    getBalance: (address: string) => Promise<AssetBalance>;
    isValidAddress: (address: string) => boolean;
    explorerUrl: (hash: string) => string;
  },
): ChainAdapter {
  const config = CHAIN_REGISTRY[chain];
  return {
    config,
    getNetworkStatus: impl.getNetworkStatus,
    getBalance: impl.getBalance,
    isValidAddress: impl.isValidAddress,
    explorerTxUrl: impl.explorerUrl,
    async healthCheck(): Promise<HealthCheckResult> {
      const live = isConfigured(config.rpcEnvVar);
      const started = performance.now();
      try {
        await impl.getNetworkStatus();
        return {
          chain,
          healthy: true,
          latencyMs: Math.round(performance.now() - started),
          usingLiveRpc: live,
          message: live ? undefined : "Using mock data — RPC endpoint not yet configured.",
        };
      } catch (e) {
        return {
          chain,
          healthy: false,
          latencyMs: null,
          usingLiveRpc: live,
          message: e instanceof Error ? e.message : "Health check failed.",
        };
      }
    },
  };
}

export const CHAIN_ADAPTERS: Record<ChainId, ChainAdapter> = {
  bitcoin: makeAdapter("bitcoin", bitcoinService),
  ethereum: makeAdapter("ethereum", ethereumService),
  bnb: makeAdapter("bnb", bnbService),
  solana: makeAdapter("solana", solanaService),
};

export function getChainAdapter(chain: ChainId): ChainAdapter {
  return CHAIN_ADAPTERS[chain];
}

export async function healthCheckAll(): Promise<HealthCheckResult[]> {
  return Promise.all(Object.values(CHAIN_ADAPTERS).map((a) => a.healthCheck()));
}
