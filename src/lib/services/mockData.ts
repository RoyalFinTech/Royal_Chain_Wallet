/**
 * Deterministic demo data generator.
 *
 * Every value is derived from the wallet's own address via a seeded PRNG,
 * so balances/history look realistic, stay stable across reloads within
 * the same wallet, and differ between wallets — without ever touching a
 * network. This is the swap-out point: replace the functions in
 * bitcoinService / ethereumService / bnbService / solanaService /
 * tokenService with real provider calls and nothing else changes.
 */
import type { AssetMeta, AssetSymbol, TxRecord, ChainId, NetworkStatus } from "./types";

export const ASSET_CATALOG: Record<AssetSymbol, AssetMeta> = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    chain: "bitcoin",
    decimals: 8,
    isToken: false,
    iconGradient: "from-orange-400 to-amber-600",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    chain: "ethereum",
    decimals: 18,
    isToken: false,
    iconGradient: "from-indigo-400 to-violet-600",
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    chain: "bnb",
    decimals: 18,
    isToken: false,
    iconGradient: "from-yellow-400 to-amber-500",
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    chain: "solana",
    decimals: 9,
    isToken: false,
    iconGradient: "from-fuchsia-400 to-purple-600",
  },
  ROY: {
    symbol: "ROY",
    name: "Royal Token",
    chain: "solana",
    decimals: 6,
    isToken: true,
    iconGradient: "from-gold to-amber-500",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    chain: "solana",
    decimals: 6,
    isToken: true,
    iconGradient: "from-emerald-400 to-teal-600",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    chain: "solana",
    decimals: 6,
    isToken: true,
    iconGradient: "from-blue-400 to-sky-600",
  },
};

const BASE_USD_PRICE: Record<AssetSymbol, number> = {
  BTC: 64200,
  ETH: 3180,
  BNB: 572,
  SOL: 148,
  ROY: 0.42,
  USDT: 1,
  USDC: 1,
};

/** Small deterministic PRNG (mulberry32) seeded from a string. */
function seedFromString(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFor(address: string, symbol: string) {
  return mulberry32(seedFromString(`${address}:${symbol}`));
}

/** Deterministic mock balance for a given address + asset. */
export function mockBalance(address: string, symbol: AssetSymbol) {
  const rand = rngFor(address, symbol);
  const price = BASE_USD_PRICE[symbol] * (0.94 + rand() * 0.12); // +/-6% live jitter
  const isStable = symbol === "USDT" || symbol === "USDC";
  const magnitude = isStable
    ? 50 + rand() * 4500
    : rand() *
      rand() *
      (symbol === "BTC"
        ? 1.4
        : symbol === "ETH"
          ? 12
          : symbol === "SOL"
            ? 220
            : symbol === "ROY"
              ? 18000
              : 30);
  const amount = Number(
    magnitude.toFixed(symbol === "BTC" ? 6 : symbol === "ETH" || symbol === "SOL" ? 4 : 2),
  );
  const change24hPct = Number(((rand() - 0.5) * 14).toFixed(2));
  return {
    symbol,
    amount,
    usdPrice: Number(price.toFixed(price < 2 ? 4 : 2)),
    usdValue: Number((amount * price).toFixed(2)),
    change24hPct,
  };
}

export function mockNetworkStatus(chain: ChainId): NetworkStatus {
  const rand = rngFor(chain, "network");
  const labelMap: Record<ChainId, string> = {
    bitcoin: "Mainnet",
    ethereum: "Mainnet",
    bnb: "Mainnet (BSC)",
    solana: "Mainnet Beta",
  };
  const feeMap: Record<ChainId, [number, number]> = {
    bitcoin: [0.6, 3.2],
    ethereum: [1.2, 9.5],
    bnb: [0.05, 0.3],
    solana: [0.0005, 0.004],
  };
  const [lo, hi] = feeMap[chain];
  const congestionRoll = rand();
  return {
    chain,
    label: labelMap[chain],
    blockHeight: Math.floor(800_000 + rand() * 4_500_000),
    avgFeeUsd: Number((lo + rand() * (hi - lo)).toFixed(4)),
    congestion: congestionRoll > 0.85 ? "high" : congestionRoll > 0.55 ? "moderate" : "low",
  };
}

const TX_MEMO_POOL = [
  "Transfer",
  "Payment received",
  "Swap settlement",
  "Staking reward",
  "Card top-up",
  "Merchant payment",
  "P2P transfer",
  "Withdrawal",
];

export function mockTransactions(address: string, symbols: AssetSymbol[], count = 12): TxRecord[] {
  const rand = rngFor(address, "tx-history");
  const out: TxRecord[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const symbol = symbols[Math.floor(rand() * symbols.length)];
    const meta = ASSET_CATALOG[symbol];
    const direction = rand() > 0.48 ? "in" : "out";
    const price = BASE_USD_PRICE[symbol];
    const amount = Number(
      (
        rand() * (symbol === "BTC" ? 0.3 : symbol === "ETH" ? 1.8 : symbol === "SOL" ? 14 : 250) +
        0.001
      ).toFixed(4),
    );
    const hash = Array.from({ length: 24 }, () => Math.floor(rand() * 16).toString(16)).join("");
    out.push({
      id: `tx_${address.slice(0, 6)}_${i}`,
      chain: meta.chain,
      symbol,
      direction,
      amount,
      usdValue: Number((amount * price).toFixed(2)),
      counterparty: `${hash.slice(0, 4)}…${hash.slice(-4)}`,
      status: rand() > 0.93 ? "pending" : rand() > 0.02 ? "confirmed" : "failed",
      timestamp: now - Math.floor(rand() * 45) * 86_400_000 - Math.floor(rand() * 86_400_000),
      feeUsd: Number((rand() * 4).toFixed(2)),
      hash,
    });
  }
  return out.sort((a, b) => b.timestamp - a.timestamp);
}
