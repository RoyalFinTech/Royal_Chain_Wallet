/**
 * Real Bitcoin data client (Priority 3).
 * Bitcoin Core's own RPC isn't safely callable from a browser (auth model
 * assumes a trusted local caller). Production wallets instead use a
 * public Esplora-compatible REST API (e.g. blockstream.info/api, or a
 * self-hosted Esplora instance) — VITE_BTC_API_URL should point at one
 * of these. This client speaks that REST interface.
 */
import { NetworkError, NotConfiguredError } from "@/lib/errors/types";

async function getJson<T>(baseUrl: string, path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) throw new NetworkError(`Bitcoin API HTTP ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

export interface BitcoinAddressStats {
  address: string;
  chain_stats: { funded_txo_sum: number; spent_txo_sum: number; tx_count: number };
  mempool_stats: { funded_txo_sum: number; spent_txo_sum: number; tx_count: number };
}

export interface BitcoinBalanceResult {
  satoshis: number;
  btc: number;
}

export async function getBtcBalance(
  baseUrl: string,
  address: string,
): Promise<BitcoinBalanceResult> {
  const stats = await getJson<BitcoinAddressStats>(baseUrl, `/address/${address}`);
  const satoshis =
    stats.chain_stats.funded_txo_sum -
    stats.chain_stats.spent_txo_sum +
    stats.mempool_stats.funded_txo_sum -
    stats.mempool_stats.spent_txo_sum;
  return { satoshis, btc: satoshis / 100_000_000 };
}

export interface BitcoinTx {
  txid: string;
  status: { confirmed: boolean; block_height?: number; block_time?: number };
  vin: { prevout?: { scriptpubkey_address?: string; value: number } }[];
  vout: { scriptpubkey_address?: string; value: number }[];
}

export async function getAddressTransactions(
  baseUrl: string,
  address: string,
): Promise<BitcoinTx[]> {
  return getJson<BitcoinTx[]>(baseUrl, `/address/${address}/txs`);
}

export async function getTipHeight(baseUrl: string): Promise<number> {
  const res = await fetch(`${baseUrl}/blocks/tip/height`);
  if (!res.ok) throw new NetworkError(`Bitcoin API HTTP ${res.status}`);
  return Number(await res.text());
}

export async function getRecommendedFeeRate(baseUrl: string): Promise<number> {
  const fees = await getJson<Record<string, number>>(baseUrl, "/fee-estimates");
  return fees["6"] ?? fees["144"] ?? 1; // sat/vB targeting ~1hr confirmation, falling back to slow
}

export interface BitcoinUtxo {
  txid: string;
  vout: number;
  value: number; // satoshis
  status: { confirmed: boolean };
}

export async function getUtxos(baseUrl: string, address: string): Promise<BitcoinUtxo[]> {
  return getJson<BitcoinUtxo[]>(baseUrl, `/address/${address}/utxo`);
}

/** Broadcasts a raw signed transaction (hex-encoded). Returns the txid. */
export async function broadcastTransaction(baseUrl: string, rawTxHex: string): Promise<string> {
  const res = await fetch(`${baseUrl}/tx`, { method: "POST", body: rawTxHex });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new NetworkError(`Bitcoin broadcast failed: HTTP ${res.status} ${body}`.trim());
  }
  return (await res.text()).trim(); // Esplora returns the raw txid as plain text
}

export async function getTxStatus(
  baseUrl: string,
  txid: string,
): Promise<{ confirmed: boolean; blockHeight?: number } | null> {
  try {
    const tx = await getJson<BitcoinTx>(baseUrl, `/tx/${txid}`);
    return { confirmed: tx.status.confirmed, blockHeight: tx.status.block_height };
  } catch {
    return null; // not found yet — still propagating, or broadcast failed silently upstream
  }
}

export function requireApiUrl(apiUrl: string | undefined): string {
  if (!apiUrl) throw new NotConfiguredError("Bitcoin API");
  return apiUrl;
}
