export type TxStatus = "completed" | "pending" | "failed";
export type TxType = "sent" | "received" | "bill" | "deposit" | "airtime" | "withdraw";

export interface Transaction {
  id: string;
  type: TxType;
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  date: string;
  status: TxStatus;
}

export const CURRENCY = "D";

export const formatMoney = (n: number, currency = CURRENCY) =>
  `${currency}${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    type: "received",
    title: "Fatou Njie",
    subtitle: "Wallet transfer",
    amount: 2500,
    currency: CURRENCY,
    date: "Today, 10:24",
    status: "completed",
  },
  {
    id: "t2",
    type: "sent",
    title: "Musa Ceesay",
    subtitle: "Sent to +220 3xx xxx",
    amount: -450,
    currency: CURRENCY,
    date: "Today, 09:02",
    status: "completed",
  },
  {
    id: "t3",
    type: "bill",
    title: "NAWEC Electricity",
    subtitle: "Bill payment",
    amount: -1200,
    currency: CURRENCY,
    date: "Yesterday",
    status: "completed",
  },
  {
    id: "t4",
    type: "airtime",
    title: "Africell Airtime",
    subtitle: "+220 7xx xxx xx",
    amount: -100,
    currency: CURRENCY,
    date: "Yesterday",
    status: "completed",
  },
  {
    id: "t5",
    type: "deposit",
    title: "Wave Deposit",
    subtitle: "Top up",
    amount: 5000,
    currency: CURRENCY,
    date: "Jul 8",
    status: "completed",
  },
  {
    id: "t6",
    type: "withdraw",
    title: "Agent Withdrawal",
    subtitle: "Kanifing branch",
    amount: -3000,
    currency: CURRENCY,
    date: "Jul 7",
    status: "pending",
  },
  {
    id: "t7",
    type: "received",
    title: "Daha Pay Refund",
    subtitle: "Merchant refund",
    amount: 850,
    currency: CURRENCY,
    date: "Jul 6",
    status: "completed",
  },
  {
    id: "t8",
    type: "sent",
    title: "Awa Jallow",
    subtitle: "Sent to wallet",
    amount: -1500,
    currency: CURRENCY,
    date: "Jul 5",
    status: "failed",
  },
];

export const SPEND_DATA = [
  { name: "Mon", amount: 1200 },
  { name: "Tue", amount: 800 },
  { name: "Wed", amount: 1600 },
  { name: "Thu", amount: 450 },
  { name: "Fri", amount: 2100 },
  { name: "Sat", amount: 900 },
  { name: "Sun", amount: 300 },
];

export const INCOME_DATA = [
  { name: "Mon", amount: 500 },
  { name: "Tue", amount: 2500 },
  { name: "Wed", amount: 0 },
  { name: "Thu", amount: 1200 },
  { name: "Fri", amount: 0 },
  { name: "Sat", amount: 3400 },
  { name: "Sun", amount: 850 },
];

export { COUNTRIES } from "./countries";

export const DEPOSIT_METHODS = [
  { id: "wave", name: "Wave", desc: "Instant top up", icon: "🌊", fee: "Free" },
  { id: "afri", name: "AfriMoney", desc: "Mobile money", icon: "📱", fee: "1%" },
  { id: "bank", name: "Bank Transfer", desc: "1–2 business days", icon: "🏦", fee: "Free" },
  { id: "agent", name: "Agent Deposit", desc: "Nearest agent", icon: "🧑‍💼", fee: "Free" },
  { id: "card", name: "Card Payment", desc: "Visa / Mastercard", icon: "💳", fee: "2.5%" },
];
