/**
 * walletService — aggregates balances across every chain + SPL token into
 * one portfolio view. This is the only service the dashboard needs to
 * call directly; it fans out to the per-chain services underneath.
 */
import type { DerivedAddresses } from "@/lib/wallet/derive";
import * as bitcoinService from "./bitcoinService";
import * as ethereumService from "./ethereumService";
import * as bnbService from "./bnbService";
import * as solanaService from "./solanaService";
import * as tokenService from "./tokenService";
import type { AssetBalance } from "./types";

export interface Portfolio {
  totalUsd: number;
  change24hUsd: number;
  change24hPct: number;
  assets: AssetBalance[];
}

export async function getPortfolio(addresses: DerivedAddresses): Promise<Portfolio> {
  const [btc, eth, bnb, sol, tokens] = await Promise.all([
    bitcoinService.getBalance(addresses.bitcoin.address),
    ethereumService.getBalance(addresses.ethereum.address),
    bnbService.getBalance(addresses.bnb.address),
    solanaService.getBalance(addresses.solana.address),
    tokenService.getTokenBalances(addresses.solana.address),
  ]);

  const assets = [btc, eth, bnb, sol, ...tokens];
  const totalUsd = assets.reduce((sum, a) => sum + a.usdValue, 0);
  const change24hUsd = assets.reduce((sum, a) => sum + a.usdValue * (a.change24hPct / 100), 0);
  const change24hPct = totalUsd > 0 ? (change24hUsd / (totalUsd - change24hUsd)) * 100 : 0;

  return {
    totalUsd: Number(totalUsd.toFixed(2)),
    change24hUsd: Number(change24hUsd.toFixed(2)),
    change24hPct: Number(change24hPct.toFixed(2)),
    assets: assets.sort((a, b) => b.usdValue - a.usdValue),
  };
}

export function addressForSymbol(
  addresses: DerivedAddresses,
  symbol: AssetBalance["symbol"],
): string {
  switch (symbol) {
    case "BTC":
      return addresses.bitcoin.address;
    case "ETH":
      return addresses.ethereum.address;
    case "BNB":
      return addresses.bnb.address;
    case "SOL":
    case "ROY":
    case "USDT":
    case "USDC":
      return addresses.solana.address; // SPL tokens live at the Solana address
  }
}
