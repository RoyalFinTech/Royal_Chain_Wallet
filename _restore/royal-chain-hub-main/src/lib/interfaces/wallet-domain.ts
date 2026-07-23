/**
 * Backend service interfaces — wallet domain (Module 3).
 *
 * Pure contracts, no implementations. The current app runs entirely on
 * the mock services in src/lib/services/*; those already satisfy the
 * *shape* of these interfaces informally. A later integration phase
 * provides concrete classes (e.g. SupabaseWalletService,
 * SolanaRpcWalletService) that implement these exactly, and the UI swaps
 * over without changes because it already talks to functions with this
 * shape.
 */
import type { ChainId } from "@/lib/wallet/derive";
import type {
  WalletRecord,
  WalletAccountRecord,
  BalanceRecord,
  TransactionRecord,
  SwapHistoryRecord,
  StakingPositionRecord,
  StakingRewardRecord,
  ValidatorRecord,
} from "@/lib/db/models";

export interface WalletService {
  createWallet(userId: string, label?: string): Promise<WalletRecord>;
  importWallet(userId: string, mnemonic: string, label?: string): Promise<WalletRecord>;
  listWallets(userId: string): Promise<WalletRecord[]>;
  getAccounts(walletId: string): Promise<WalletAccountRecord[]>;
  getBalances(walletId: string): Promise<BalanceRecord[]>;
  exportMnemonic(walletId: string, pin: string): Promise<string>;
  deleteWallet(walletId: string, pin: string): Promise<void>;
}

export interface TransactionService {
  send(opts: {
    walletId: string;
    chain: ChainId;
    toAddress: string;
    assetSymbol: string;
    amount: number;
    memo?: string;
  }): Promise<TransactionRecord>;
  getHistory(
    walletId: string,
    opts?: { chain?: ChainId; limit?: number },
  ): Promise<TransactionRecord[]>;
  getByHash(txHash: string): Promise<TransactionRecord | null>;
  estimateFee(chain: ChainId, assetSymbol: string, amount: number): Promise<number>;
}

export interface SwapService {
  getQuote(
    fromSymbol: string,
    toSymbol: string,
    fromAmount: number,
  ): Promise<{
    toAmount: number;
    rate: number;
    priceImpactPct: number;
    networkFeeUsd: number;
  }>;
  executeSwap(opts: {
    walletId: string;
    fromSymbol: string;
    toSymbol: string;
    fromAmount: number;
    slippagePct: number;
  }): Promise<SwapHistoryRecord>;
  getSwapHistory(walletId: string): Promise<SwapHistoryRecord[]>;
}

export interface ValidatorService {
  listValidators(chain?: ChainId): Promise<ValidatorRecord[]>;
  getPositions(walletId: string): Promise<StakingPositionRecord[]>;
  stake(opts: {
    walletId: string;
    assetSymbol: string;
    amount: number;
    validatorId?: string;
  }): Promise<StakingPositionRecord>;
  unstake(positionId: string): Promise<StakingPositionRecord>;
  getRewards(walletId: string): Promise<StakingRewardRecord[]>;
  claimRewards(positionId: string): Promise<StakingRewardRecord>;
}

export interface PriceService {
  getPrice(assetSymbol: string, currency?: string): Promise<number>;
  getPrices(assetSymbols: string[], currency?: string): Promise<Record<string, number>>;
  get24hChange(assetSymbol: string): Promise<number>; // percent
}
