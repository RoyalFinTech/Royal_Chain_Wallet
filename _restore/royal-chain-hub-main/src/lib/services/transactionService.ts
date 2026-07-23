/**
 * Cross-chain transaction history, send, and swap-quote service.
 *
 * getHistory is still mock/session-based — a real indexer integration is
 * a separate piece of work (see docs/REMAINING_WORK.md). submitTransfer
 * now performs a REAL signed broadcast when the target chain has a live
 * RPC endpoint configured (lib/config/chains.ts isChainLive) and a
 * mnemonic is supplied; otherwise it falls back to the existing
 * simulated flow so the app keeps working end-to-end in an unconfigured
 * environment.
 */
import { mockTransactions } from "./mockData";
import type { AssetSymbol, QuoteResult, TxRecord } from "./types";
import { isChainLive } from "@/lib/config/chains";
import { sendAndConfirm } from "@/lib/wallet/signing";
import type { ChainId } from "@/lib/wallet/derive";

const sessionTxs = new Map<string, TxRecord[]>();

export async function getHistory(address: string, symbols: AssetSymbol[]): Promise<TxRecord[]> {
  const base = mockTransactions(address, symbols, 14);
  const extra = sessionTxs.get(address) ?? [];
  return [...extra, ...base].sort((a, b) => b.timestamp - a.timestamp);
}

export async function submitTransfer(opts: {
  fromAddress: string;
  toAddress: string;
  symbol: AssetSymbol;
  chain: TxRecord["chain"];
  amount: number;
  usdValue: number;
  /**
   * The decrypted mnemonic, if the caller already unlocked the wallet
   * for this operation (see unlockWallet in lib/wallet). Required for a
   * real broadcast; omit to force the simulated flow (e.g. for
   * SPL-token sends, which aren't wired to real signing yet — see
   * docs/REMAINING_WORK.md).
   */
  mnemonic?: string;
}): Promise<TxRecord> {
  const isNativeAsset =
    opts.symbol === "BTC" ||
    opts.symbol === "ETH" ||
    opts.symbol === "BNB" ||
    opts.symbol === "SOL";

  if (opts.mnemonic && isNativeAsset && isChainLive(opts.chain as ChainId)) {
    const { txHash, confirmation } = await sendAndConfirm({
      chain: opts.chain as ChainId,
      mnemonic: opts.mnemonic,
      fromAddress: opts.fromAddress,
      toAddress: opts.toAddress,
      amount: opts.amount,
    });
    const record: TxRecord = {
      id: `tx_${Date.now()}`,
      chain: opts.chain,
      symbol: opts.symbol,
      direction: "out",
      amount: opts.amount,
      usdValue: opts.usdValue,
      counterparty: `${opts.toAddress.slice(0, 4)}…${opts.toAddress.slice(-4)}`,
      status: confirmation === "confirmed" ? "confirmed" : "failed",
      timestamp: Date.now(),
      feeUsd: 0, // real fee is embedded in the chain's own accounting; not separately tracked client-side yet
      hash: txHash,
    };
    const existing = sessionTxs.get(opts.fromAddress) ?? [];
    sessionTxs.set(opts.fromAddress, [record, ...existing]);
    return record;
  }

  // Simulated fallback: chain not live, no mnemonic supplied, or an
  // SPL-token asset (real SPL transfer signing isn't wired yet).
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
  const hash = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    "",
  );
  const record: TxRecord = {
    id: `tx_${Date.now()}`,
    chain: opts.chain,
    symbol: opts.symbol,
    direction: "out",
    amount: opts.amount,
    usdValue: opts.usdValue,
    counterparty: `${opts.toAddress.slice(0, 4)}…${opts.toAddress.slice(-4)}`,
    status: "confirmed",
    timestamp: Date.now(),
    feeUsd: Number((Math.random() * 2 + 0.05).toFixed(2)),
    hash,
  };
  const existing = sessionTxs.get(opts.fromAddress) ?? [];
  sessionTxs.set(opts.fromAddress, [record, ...existing]);
  return record;
}

const PRICE_USD: Record<AssetSymbol, number> = {
  BTC: 64200,
  ETH: 3180,
  BNB: 572,
  SOL: 148,
  ROY: 0.42,
  USDT: 1,
  USDC: 1,
};

export async function getSwapQuote(
  fromSymbol: AssetSymbol,
  toSymbol: AssetSymbol,
  fromAmount: number,
): Promise<QuoteResult> {
  await new Promise((r) => setTimeout(r, 350));
  const rate = PRICE_USD[fromSymbol] / PRICE_USD[toSymbol];
  return {
    fromSymbol,
    toSymbol,
    fromAmount,
    toAmount: Number((fromAmount * rate * 0.997).toFixed(6)), // ~0.3% swap fee
    rate,
    networkFeeUsd: 0.02,
    slippagePct: 0.5,
  };
}
