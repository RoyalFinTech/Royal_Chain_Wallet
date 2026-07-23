/**
 * Signing + send orchestration — real implementation.
 *
 * Every chain's private key is re-derived transiently from the decrypted
 * mnemonic for a single operation and never persisted. This is the
 * on-device half of a transaction; nothing in this file or its
 * dependencies (sign-keys.ts, services/tx/*) ever makes a network call
 * to Supabase — only to the chain's own RPC/API endpoint, and only when
 * that chain is configured live (see lib/config/chains.ts isChainLive).
 *
 * DELIBERATE NON-RETRY OF BROADCASTS: confirmation polling (below)
 * retries reads with backoff, but the broadcast call itself is never
 * auto-retried here. For Solana, re-submitting identical signed bytes
 * is safe (the network treats it as the same transaction). For EVM and
 * Bitcoin it is NOT safe in general: ethers.js's sendTransaction fetches
 * a fresh nonce on every call, and the Bitcoin UTXO selection re-runs
 * against current UTXOs on every call — a retry after a network timeout
 * (where the first attempt actually landed) could broadcast a SECOND,
 * independently valid transaction and double-send funds. A failed
 * broadcast surfaces as an error for the user to check on an explorer
 * before deciding to retry manually, rather than the app silently
 * risking a duplicate send.
 */
import type { ChainId } from "./derive";
import { deriveSolanaSigningKey, deriveEvmSigningKey, deriveBitcoinSigningKey } from "./sign-keys";
import { sendSolTransaction } from "@/lib/services/tx/solana-tx";
import { sendEvmTransaction, checkEvmConfirmation } from "@/lib/services/tx/evm-tx";
import { sendBtcTransaction } from "@/lib/services/tx/bitcoin-tx";
import { getSignatureStatuses } from "@/lib/services/rpc/solana-rpc";
import { getTxStatus as getBtcTxStatus } from "@/lib/services/rpc/bitcoin-rpc";
import { pollForConfirmation, type ConfirmationOutcome } from "@/lib/services/tx/confirmation";
import { isChainLive, chainEndpoint } from "@/lib/config/chains";
import { AppError } from "@/lib/errors/types";

export interface SendAndConfirmRequest {
  chain: ChainId;
  mnemonic: string;
  fromAddress: string;
  toAddress: string;
  amount: number; // human units (SOL, ETH, BTC, ...)
}

export interface SendAndConfirmResult {
  txHash: string;
  confirmation: ConfirmationOutcome;
}

/**
 * Signs and broadcasts a native-asset transfer, then polls for
 * confirmation. Throws NotConfiguredError (via isChainLive check
 * upstream in chain services) if the chain has no RPC endpoint set —
 * callers should check isChainLive(chain) themselves before reaching
 * for this, exactly as the existing per-chain services already do for
 * balance reads.
 */
export async function sendAndConfirm(req: SendAndConfirmRequest): Promise<SendAndConfirmResult> {
  if (!isChainLive(req.chain)) {
    throw new AppError("not_configured", `${req.chain} has no RPC endpoint configured.`);
  }
  const rpcUrl = chainEndpoint(req.chain)!;

  switch (req.chain) {
    case "solana": {
      const key = await deriveSolanaSigningKey(req.mnemonic);
      const { txHash } = await sendSolTransaction(
        rpcUrl,
        key,
        req.fromAddress,
        req.toAddress,
        req.amount,
      );
      const confirmation = await pollForConfirmation(async () => {
        const [status] = await getSignatureStatuses(rpcUrl, [txHash]);
        if (!status) return "not_found";
        if (status.err) return "failed";
        return status.confirmationStatus === "confirmed" ||
          status.confirmationStatus === "finalized"
          ? "confirmed"
          : "pending";
      });
      return { txHash, confirmation };
    }

    case "ethereum":
    case "bnb": {
      const key = await deriveEvmSigningKey(req.mnemonic);
      const { txHash } = await sendEvmTransaction(rpcUrl, key, req.toAddress, req.amount);
      const confirmation = await pollForConfirmation(async () => {
        const status = await checkEvmConfirmation(rpcUrl, txHash);
        return status === "not_found" ? "not_found" : status;
      });
      return { txHash, confirmation };
    }

    case "bitcoin": {
      const key = await deriveBitcoinSigningKey(req.mnemonic);
      const { txHash } = await sendBtcTransaction(rpcUrl, key, req.toAddress, req.amount);
      const confirmation = await pollForConfirmation(
        async () => {
          const status = await getBtcTxStatus(rpcUrl, txHash);
          if (!status) return "not_found";
          return status.confirmed ? "confirmed" : "pending";
        },
        { timeoutMs: 20 * 60_000, intervalMs: 15_000, maxIntervalMs: 30_000 }, // Bitcoin confirms much slower than Solana/EVM
      );
      return { txHash, confirmation };
    }
  }
}

/** Message signing (e.g. proving address ownership) — Solana/EVM only; not meaningful for Bitcoin's UTXO model here. */
export async function signMessage(
  mnemonic: string,
  chain: "solana" | "ethereum" | "bnb",
  message: string,
): Promise<string> {
  if (chain === "solana") {
    const nacl = (await import("tweetnacl")).default;
    const bs58 = (await import("bs58")).default;
    const key = await deriveSolanaSigningKey(mnemonic);
    const sig = nacl.sign.detached(new TextEncoder().encode(message), key.secretKey);
    return bs58.encode(sig);
  }
  const key = await deriveEvmSigningKey(mnemonic);
  const { Wallet } = await import("ethers");
  const wallet = new Wallet(key.privateKeyHex);
  return wallet.signMessage(message);
}
