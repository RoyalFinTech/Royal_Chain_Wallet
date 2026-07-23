/**
 * CAIP-2 chain identifiers for WalletConnect session namespaces.
 *
 * CONFIDENCE NOTE: EVM chain IDs (eip155:*) are standardized and
 * certain — they're just the chain's numeric ID. The Solana CAIP-2
 * references below use the shorthand cluster names ("solana:mainnet",
 * "solana:devnet") that several WalletConnect/Solana integration guides
 * document, rather than genesis-hash-based references — double-check
 * these against current Reown documentation before relying on them in
 * production; I'm not able to verify them against a live source from
 * this environment. Bitcoin has no standardized, widely-adopted
 * WalletConnect namespace, so it's intentionally not included — dapps
 * requesting Bitcoin sessions aren't supported by this integration.
 */
import type { EvmNetworkId } from "@/lib/config/evm-networks";
import { EVM_NETWORKS } from "@/lib/config/evm-networks";

export const EVM_CAIP2: Record<Exclude<EvmNetworkId, "base">, string> = {
  ethereum: `eip155:1`,
  bnb: `eip155:56`,
  polygon: `eip155:137`,
};
// Base's chain id (8453) as a CAIP-2 reference, kept separate since
// EVM_NETWORKS' chainIdHex already carries the authoritative numeric id.
export const BASE_CAIP2 = `eip155:${parseInt(EVM_NETWORKS.base.chainIdHex, 16)}`;

export const SOLANA_CAIP2 = {
  mainnet: "solana:mainnet",
  devnet: "solana:devnet",
} as const;

export const SUPPORTED_WC_NAMESPACES = ["eip155", "solana"] as const;
