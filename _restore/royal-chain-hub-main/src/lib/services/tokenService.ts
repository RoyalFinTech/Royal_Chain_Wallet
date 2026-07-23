/**
 * SPL token service — Royal Token (ROY), USDT, and USDC, all issued on
 * Solana as SPL tokens and held at the wallet's Solana address.
 *
 * Currently backed by deterministic mock data. To go live, replace with
 * @solana/spl-token getAccount/getAssociatedTokenAddress calls against
 * each token's real mint address (env-configured, e.g. VITE_ROY_MINT).
 */
import { mockBalance } from "./mockData";
import type { AssetBalance } from "./types";
import { ASSET_CATALOG } from "./mockData";

export const TOKEN_SYMBOLS = ["ROY", "USDT", "USDC"] as const;

export async function getTokenBalances(solanaAddress: string): Promise<AssetBalance[]> {
  return Promise.all(TOKEN_SYMBOLS.map((s) => mockBalance(solanaAddress, s)));
}

export async function getTokenBalance(
  solanaAddress: string,
  symbol: (typeof TOKEN_SYMBOLS)[number],
): Promise<AssetBalance> {
  return mockBalance(solanaAddress, symbol);
}

export function tokenMeta(symbol: (typeof TOKEN_SYMBOLS)[number]) {
  return ASSET_CATALOG[symbol];
}
