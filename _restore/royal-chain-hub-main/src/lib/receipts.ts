// Digital receipt data model used by transaction receipts across the app.
import type { CurrencyCode } from "./currencies";

export interface ReceiptData {
  receiptNo: string;
  txId: string;
  hash: string; // blockchain hash placeholder
  method: string;
  status: "completed" | "pending" | "failed" | "cancelled";
  amount: number;
  fee: number;
  currency: CurrencyCode;
  sender: { name: string; walletId: string; address?: string };
  receiver: { name: string; walletId: string; address?: string };
  date: string; // ISO
  note?: string;
  exchangeRate?: string;
}

export function makeReceiptNo(seed = Date.now()) {
  return `RCP-${String(seed).slice(-8)}`;
}

export function makeHash() {
  const hex = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 40; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}
