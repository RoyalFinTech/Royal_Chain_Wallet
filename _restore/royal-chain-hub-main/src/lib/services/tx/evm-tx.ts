/**
 * Real EVM transaction signing + broadcast.
 *
 * Uses ethers.js's Wallet class, which correctly handles nonce fetching,
 * gas estimation, RLP serialization, and secp256k1 signing internally —
 * deliberately not hand-rolled, since getting transaction serialization
 * subtly wrong is exactly the kind of bug that's invisible until funds
 * are lost. Runs entirely client-side: the private key is constructed
 * transiently from the decrypted mnemonic, used for one signing
 * operation, and never persisted or sent anywhere.
 */
import { JsonRpcProvider, Wallet, parseEther } from "ethers";
import type { EvmSigningKey } from "@/lib/wallet/sign-keys";
import { NetworkError } from "@/lib/errors/types";

export interface EvmSendResult {
  txHash: string;
  nonce: number;
}

export async function sendEvmTransaction(
  rpcUrl: string,
  key: EvmSigningKey,
  toAddress: string,
  amountEther: number,
): Promise<EvmSendResult> {
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(key.privateKeyHex, provider);

  try {
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: parseEther(amountEther.toString()),
    });
    return { txHash: tx.hash, nonce: tx.nonce };
  } catch (e) {
    throw new NetworkError(e instanceof Error ? e.message : "EVM transaction broadcast failed.");
  }
}

export type EvmConfirmationStatus = "pending" | "confirmed" | "failed" | "not_found";

/** Polls for a transaction receipt. Does not block indefinitely — see confirmWithPolling in confirmation.ts for the retry/timeout wrapper. */
export async function checkEvmConfirmation(
  rpcUrl: string,
  txHash: string,
): Promise<EvmConfirmationStatus> {
  const provider = new JsonRpcProvider(rpcUrl);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return "not_found"; // still in mempool, or dropped
  if (receipt.status === 1) return "confirmed";
  if (receipt.status === 0) return "failed";
  return "pending";
}
