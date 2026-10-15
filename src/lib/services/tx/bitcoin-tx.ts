/**
 * Bitcoin transaction orchestration: fetch UTXOs, select enough to cover
 * amount + fee, build + sign a PSBT (P2WPKH), broadcast.
 *
 * PSBT construction, signing, and finalization all go through
 * bitcoinjs-lib (mature, widely-audited) — only UTXO selection and fee
 * estimation are hand-written here, which is comparatively low-risk
 * (worst case: overpay fee or fail to build, not an invalid signature).
 */
import { Buffer } from "buffer";
import * as bitcoin from "bitcoinjs-lib";
import {
  getUtxos,
  broadcastTransaction,
  getRecommendedFeeRate,
  type BitcoinUtxo,
} from "../rpc/bitcoin-rpc";
import type { BitcoinSigningKey } from "@/lib/wallet/sign-keys";
import { AppError, NetworkError } from "@/lib/errors/types";

const DUST_LIMIT = 546; // satoshis — outputs below this are non-standard and get rejected by relay nodes

interface UtxoSelection {
  selected: BitcoinUtxo[];
  totalIn: number;
  fee: number;
  change: number;
}

/** Simple greedy UTXO selection: accumulate confirmed UTXOs until covering amount + estimated fee. */
function selectUtxos(
  utxos: BitcoinUtxo[],
  amountSats: number,
  feeRateSatPerVb: number,
): UtxoSelection {
  const confirmed = utxos.filter((u) => u.status.confirmed).sort((a, b) => b.value - a.value);
  const selected: BitcoinUtxo[] = [];
  let totalIn = 0;

  // Rough vsize estimate for a P2WPKH tx: 10 (overhead) + 68/input + 31/output, 2 outputs (recipient + change)
  const estimateVsize = (numInputs: number) => 10 + numInputs * 68 + 2 * 31;

  for (const utxo of confirmed) {
    selected.push(utxo);
    totalIn += utxo.value;
    const fee = Math.ceil(estimateVsize(selected.length) * feeRateSatPerVb);
    if (totalIn >= amountSats + fee) {
      const change = totalIn - amountSats - fee;
      return { selected, totalIn, fee, change };
    }
  }

  throw new AppError(
    "insufficient_funds",
    "Not enough confirmed UTXOs to cover this amount plus network fee.",
  );
}

export interface BitcoinSendResult {
  txHash: string;
}

export async function sendBtcTransaction(
  apiUrl: string,
  key: BitcoinSigningKey,
  toAddress: string,
  amountBtc: number,
): Promise<BitcoinSendResult> {
  const amountSats = Math.round(amountBtc * 100_000_000);
  const [utxos, feeRate] = await Promise.all([
    getUtxos(apiUrl, key.address),
    getRecommendedFeeRate(apiUrl),
  ]);

  const { selected, change } = selectUtxos(utxos, amountSats, feeRate);

  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });

  for (const utxo of selected) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: bitcoin.payments.p2wpkh({
          pubkey: Buffer.from(key.signer.publicKey),
          network: bitcoin.networks.bitcoin,
        }).output!,
        value: BigInt(utxo.value),
      },
    });
  }

  psbt.addOutput({ address: toAddress, value: BigInt(amountSats) });
  if (change > DUST_LIMIT) {
    psbt.addOutput({ address: key.address, value: BigInt(change) });
  } // else: change is dust, let it go to the miner fee instead of creating an unspendable output

  psbt.signAllInputs(key.signer);
  psbt.finalizeAllInputs();

  const rawTxHex = psbt.extractTransaction().toHex();

  try {
    const txid = await broadcastTransaction(apiUrl, rawTxHex);
    return { txHash: txid };
  } catch (e) {
    throw new NetworkError(
      e instanceof Error ? e.message : "Bitcoin transaction broadcast failed.",
    );
  }
}
