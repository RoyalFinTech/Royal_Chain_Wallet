import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "./app.wallet";
import { MOCK_TRANSACTIONS, type Transaction } from "@/lib/mock-data";
import { TransactionCard } from "@/components/wallet/TransactionCard";
import { Search, SlidersHorizontal, Download, CalendarRange } from "lucide-react";
import { useMemo, useState } from "react";
import { TransactionDetailsSheet } from "@/components/wallet/TransactionDetailsSheet";
import { DEMO_IDENTITY } from "@/lib/wallet-identity";
import { makeHash, makeReceiptNo, type ReceiptData } from "@/lib/receipts";
import { TransactionListSkeleton } from "@/components/ui/skeletons";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";

export const Route = createFileRoute("/app/transactions")({
  component: TxHistory,
});

const tabs = ["All", "Sent", "Received", "Deposits", "Withdrawals", "QR", "Exchange"] as const;
const statuses = ["All", "Completed", "Pending", "Failed"] as const;
const ranges = ["Today", "7 days", "30 days", "Custom"] as const;
type Tab = (typeof tabs)[number];
type Status = (typeof statuses)[number];
type Range = (typeof ranges)[number];

const typeFilter = (t: Tab) => (tx: Transaction) => {
  if (t === "All") return true;
  if (t === "Sent") return tx.type === "sent";
  if (t === "Received") return tx.type === "received";
  if (t === "Deposits") return tx.type === "deposit";
  if (t === "Withdrawals") return tx.type === "withdraw";
  if (t === "QR") return tx.type === "bill" || tx.type === "airtime";
  return false; // Exchange (no mock yet)
};

function toReceipt(tx: Transaction): ReceiptData {
  const isIn = tx.amount > 0;
  return {
    receiptNo: makeReceiptNo(parseInt(tx.id.replace(/\D/g, "") || "0", 10) * 137 + 100000),
    txId: `TX-${tx.id.toUpperCase()}-${tx.date.replace(/\W/g, "")}`,
    hash: makeHash(),
    method:
      tx.type === "bill"
        ? "QR Payment"
        : tx.type === "deposit"
          ? "Bank / Mobile Money"
          : "Wallet Transfer",
    status: tx.status,
    amount: tx.amount,
    fee: Math.max(0.5, +(Math.abs(tx.amount) * 0.004).toFixed(2)),
    currency: "USD",
    sender: isIn
      ? { name: tx.title, walletId: "RCW-XXXX-1029" }
      : {
          name: "Fatoumata Njie",
          walletId: DEMO_IDENTITY.walletId,
          address: DEMO_IDENTITY.address,
        },
    receiver: isIn
      ? { name: "Fatoumata Njie", walletId: DEMO_IDENTITY.walletId, address: DEMO_IDENTITY.address }
      : { name: tx.title, walletId: "RCW-XXXX-9182" },
    date: new Date().toISOString(),
    note: tx.subtitle,
  };
}

function TxHistory() {
  const [tab, setTab] = useState<Tab>("All");
  const [status, setStatus] = useState<Status>("All");
  const [range, setRange] = useState<Range>("30 days");
  const [q, setQ] = useState("");
  const [openFilters, setOpenFilters] = useState(false);
  const [selected, setSelected] = useState<ReceiptData | null>(null);
  const loading = useSimulatedLoading(700, [tab, status, range, q]);

  const list = useMemo(
    () =>
      MOCK_TRANSACTIONS.filter(typeFilter(tab))
        .filter((t) => (status === "All" ? true : t.status === status.toLowerCase()))
        .filter((t) => (t.title + t.subtitle).toLowerCase().includes(q.toLowerCase())),
    [tab, status, q],
  );

  return (
    <div className="px-5 pt-10">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <PageHeader title="Transactions" subtitle="All wallet activity in one place" />
        <button
          className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full glass"
          title="Export"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-input/40 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, note or reference"
            className="w-full bg-transparent py-3 text-sm focus:outline-none"
          />
        </div>
        <button
          onClick={() => setOpenFilters((o) => !o)}
          className={`grid h-12 w-12 place-items-center rounded-2xl border border-border ${openFilters ? "gradient-gold text-navy" : "bg-card"}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              tab === t
                ? "gradient-gold text-navy shadow-glow"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {openFilters && (
        <div className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-3 animate-fade-in">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                    status === s
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Date range
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium ${
                    range === r ? "bg-gold text-navy" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r === "Custom" && <CalendarRange className="h-3 w-3" />}
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2">
        {loading ? (
          <TransactionListSkeleton rows={6} />
        ) : list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground animate-fade-in">
            No transactions found.
          </p>
        ) : (
          list.map((tx, i) => (
            <button
              key={tx.id}
              onClick={() => setSelected(toReceipt(tx))}
              className="press block w-full text-left animate-fade-in"
              style={{
                animationDelay: `${Math.min(i * 40, 240)}ms`,
                animationFillMode: "backwards",
              }}
            >
              <TransactionCard tx={tx} />
            </button>
          ))
        )}
      </div>

      <TransactionDetailsSheet data={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
