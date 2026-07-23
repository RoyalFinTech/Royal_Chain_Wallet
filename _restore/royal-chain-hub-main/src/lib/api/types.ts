/**
 * API request/response models (Module 8).
 *
 * These describe the wire format for the future Royal Chain backend API.
 * No endpoint returns these yet — src/lib/services/* mock data fills the
 * same role today. Once VITE_API_BASE_URL is configured, client.ts calls
 * real endpoints and maps responses into these shapes.
 */
import type { ChainId } from "@/lib/wallet/derive";
import type { AssetSymbol } from "@/lib/services/types";

export interface ApiEnvelope<T> {
  data: T;
  requestId: string;
  timestamp: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
}

/* Wallet */
export interface CreateWalletRequest {
  pin: string;
  label?: string;
}
export interface CreateWalletResponse {
  walletId: string;
  addresses: Record<ChainId, string>;
}

/* Transactions */
export interface SendRequest {
  walletId: string;
  chain: ChainId;
  toAddress: string;
  assetSymbol: AssetSymbol;
  amount: number;
  memo?: string;
}
export interface SendResponse {
  transactionId: string;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
}

/* Swap */
export interface SwapQuoteRequest {
  fromSymbol: AssetSymbol;
  toSymbol: AssetSymbol;
  fromAmount: number;
}
export interface SwapQuoteResponse {
  toAmount: number;
  rate: number;
  priceImpactPct: number;
  networkFeeUsd: number;
  expiresAt: string;
}

/* Price */
export interface PriceRequest {
  symbols: AssetSymbol[];
  currency?: string;
}
export interface PriceResponse {
  prices: Record<string, number>;
  asOf: string;
}

/* Staking */
export interface StakeRequest {
  walletId: string;
  assetSymbol: "SOL" | "ROY";
  amount: number;
  validatorId?: string;
}
export interface StakeResponse {
  positionId: string;
  txHash: string;
}

/* Notifications */
export interface RegisterPushTokenRequest {
  deviceId: string;
  token: string;
  platform: "ios" | "android" | "web";
}

/* Auth */
export interface SignInRequest {
  email: string;
  password: string;
}
export interface SignInResponse {
  userId: string;
  sessionToken: string;
  expiresAt: string;
}

/* Admin */
export interface AdminListUsersRequest {
  query?: string;
  page?: number;
  pageSize?: number;
}
export interface AdminListUsersResponse {
  users: unknown[];
  total: number;
  page: number;
}

/* Treasury */
export interface TreasurySnapshotResponse {
  totalUsd: number;
  pools: { symbol: AssetSymbol; amount: number; usdValue: number }[];
}
