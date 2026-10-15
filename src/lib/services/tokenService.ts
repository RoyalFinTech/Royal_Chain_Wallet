/**
 * SPL token support is intentionally fail-closed until real mint accounts,
 * token account reads, and signed SPL transfers are implemented.
 *
 * The previous implementation returned deterministic mock token balances,
 * which could be mistaken for assets actually held at the user's address.
 */
import { NotConfiguredError } from "@/lib/errors/types";
import type { AssetBalance } from "./types";
import { ASSET_CATALOG } from "./mockData";

export const TOKEN_SYMBOLS = ["ROY", "USDT", "USDC"] as const;

export async function getTokenBalances(_solanaAddress: string): Promise<AssetBalance[]> {
  // No real SPL token RPC/mint integration exists in this build.
  return [];
}

export async function getTokenBalance(
  _solanaAddress: string,
  symbol: (typeof TOKEN_SYMBOLS)[number],
): Promise<AssetBalance> {
  throw new NotConfiguredError(`Live ${symbol} SPL-token balance lookup`);
}

export function tokenMeta(symbol: (typeof TOKEN_SYMBOLS)[number]) {
  return ASSET_CATALOG[symbol];
}
