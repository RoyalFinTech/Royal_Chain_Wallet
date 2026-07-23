/**
 * Solana transaction orchestration: fetch a recent blockhash, build +
 * sign a transfer, broadcast it. See solana-wire.ts for the serialization
 * itself and its confidence caveats.
 */
import { getLatestBlockhash, sendTransaction as rpcSendTransaction } from "../rpc/solana-rpc";
import { buildSignedSolTransfer } from "./solana-wire";
import type { SolanaSigningKey } from "@/lib/wallet/sign-keys";
import { NetworkError } from "@/lib/errors/types";

export interface SolanaSendResult {
  txHash: string; // == the transaction signature on Solana
}

export async function sendSolTransaction(
  rpcUrl: string,
  key: SolanaSigningKey,
  fromAddress: string,
  toAddress: string,
  amountSol: number,
): Promise<SolanaSendResult> {
  const { blockhash } = await getLatestBlockhash(rpcUrl);
  const lamports = Math.round(amountSol * 1_000_000_000);

  const { wireTx } = buildSignedSolTransfer({
    fromSecretKey: key.secretKey,
    fromAddress,
    toAddress,
    lamports,
    recentBlockhash: blockhash,
  });

  try {
    const signature = await rpcSendTransaction(rpcUrl, wireTx);
    return { txHash: signature };
  } catch (e) {
    throw new NetworkError(e instanceof Error ? e.message : "Solana transaction broadcast failed.");
  }
}
