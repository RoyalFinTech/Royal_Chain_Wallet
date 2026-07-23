/**
 * Real Solana JSON-RPC client (Priority 3).
 *
 * Deliberately implemented as raw fetch-based JSON-RPC rather than
 * @solana/web3.js's Connection class: Connection pulls in `rpc-websockets`
 * (a Node-only dependency) which breaks the Cloudflare Workers SSR bundle
 * — this was hit and fixed earlier in this project (see solanaService.ts
 * comments). Plain fetch works identically in the browser, in SSR, and
 * in Workers, with zero bundle-compatibility risk.
 */
import { NetworkError, NotConfiguredError } from "@/lib/errors/types";

interface JsonRpcResponse<T> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

async function call<T>(rpcUrl: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new NetworkError(`Solana RPC HTTP ${res.status}`);
  const body = (await res.json()) as JsonRpcResponse<T>;
  if (body.error) throw new NetworkError(`Solana RPC error: ${body.error.message}`);
  if (body.result === undefined) throw new NetworkError("Solana RPC returned no result.");
  return body.result;
}

export interface SolanaBalanceResult {
  lamports: number;
  sol: number;
}

/** Native SOL balance for an address, in lamports and SOL. */
export async function getSolBalance(rpcUrl: string, address: string): Promise<SolanaBalanceResult> {
  const result = await call<{ value: number }>(rpcUrl, "getBalance", [address]);
  return { lamports: result.value, sol: result.value / 1_000_000_000 };
}

export interface SplTokenAccount {
  mint: string;
  amount: string; // raw base units, as string (can exceed Number precision)
  decimals: number;
  uiAmount: number | null;
}

/** All SPL token accounts owned by an address, optionally filtered to one mint. */
export async function getTokenAccounts(
  rpcUrl: string,
  ownerAddress: string,
  mint?: string,
): Promise<SplTokenAccount[]> {
  const filter = mint ? { mint } : { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" };
  const result = await call<{
    value: {
      account: {
        data: {
          parsed: {
            info: {
              mint: string;
              tokenAmount: { amount: string; decimals: number; uiAmount: number | null };
            };
          };
        };
      };
    }[];
  }>(rpcUrl, "getTokenAccountsByOwner", [ownerAddress, filter, { encoding: "jsonParsed" }]);

  return result.value.map((v) => ({
    mint: v.account.data.parsed.info.mint,
    amount: v.account.data.parsed.info.tokenAmount.amount,
    decimals: v.account.data.parsed.info.tokenAmount.decimals,
    uiAmount: v.account.data.parsed.info.tokenAmount.uiAmount,
  }));
}

export interface SolanaTxSignature {
  signature: string;
  slot: number;
  err: unknown | null;
  blockTime: number | null;
}

/** Recent transaction signatures for an address (most recent first). */
export async function getSignaturesForAddress(
  rpcUrl: string,
  address: string,
  limit = 20,
): Promise<SolanaTxSignature[]> {
  return call<SolanaTxSignature[]>(rpcUrl, "getSignaturesForAddress", [address, { limit }]);
}

export async function getSlot(rpcUrl: string): Promise<number> {
  return call<number>(rpcUrl, "getSlot", []);
}

export interface LatestBlockhashResult {
  blockhash: string;
  lastValidBlockHeight: number;
}

export async function getLatestBlockhash(rpcUrl: string): Promise<LatestBlockhashResult> {
  const result = await call<{ value: LatestBlockhashResult }>(rpcUrl, "getLatestBlockhash", [
    { commitment: "finalized" },
  ]);
  return result.value;
}

/** Broadcasts a base64-encoded signed transaction. Returns the transaction signature (== tx hash on Solana). */
export async function sendTransaction(rpcUrl: string, wireTxBase64: string): Promise<string> {
  return call<string>(rpcUrl, "sendTransaction", [
    wireTxBase64,
    { encoding: "base64", skipPreflight: false, maxRetries: 3 },
  ]);
}

export type SolanaSignatureStatus = "processed" | "confirmed" | "finalized" | null;

export interface SignatureStatusResult {
  confirmationStatus: SolanaSignatureStatus;
  err: unknown | null;
}

export async function getSignatureStatuses(
  rpcUrl: string,
  signatures: string[],
): Promise<(SignatureStatusResult | null)[]> {
  const result = await call<{ value: (SignatureStatusResult | null)[] }>(
    rpcUrl,
    "getSignatureStatuses",
    [signatures, { searchTransactionHistory: true }],
  );
  return result.value;
}

export async function getHealth(rpcUrl: string): Promise<boolean> {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth", params: [] }),
    });
    const body = (await res.json()) as JsonRpcResponse<string>;
    return body.result === "ok";
  } catch {
    return false;
  }
}

export function requireRpcUrl(rpcUrl: string | undefined, chainName: string): string {
  if (!rpcUrl) throw new NotConfiguredError(`${chainName} RPC`);
  return rpcUrl;
}
