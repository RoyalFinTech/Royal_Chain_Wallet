import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Download,
  Search,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { useStoredWallet, useTransactionHistory } from "@/hooks/use-wallet";
import type { TxRecord, TxStatus } from "@/lib/services/types";

export const Route = createFileRoute("/app/transactions")({
  component: TxHistory,
});

type DirectionFilter = "all" | "out" | "in";
type StatusFilter = "all" | TxStatus;

function TxHistory() {
  const wallet = useStoredWallet();
  const query = useTransactionHistory(wallet);
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const records = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (query.data ?? [])
      .filter((tx) => direction === "all" || tx.direction === direction)
      .filter((tx) => status === "all" || tx.status === status)
      .filter(
        (tx) =>
          !q || `${tx.symbol} ${tx.hash} ${tx.counterparty} ${tx.chain}`.toLowerCase().includes(q),
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [query.data, direction, status, search]);

  const exportCsv = () => {
    if (records.length === 0) return;
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      [
        "timestamp",
        "chain",
        "asset",
        "direction",
        "amount",
        "status",
        "counterparty",
        "transaction_hash",
      ],
      ...records.map((tx) => [
        new Date(tx.timestamp).toISOString(),
        tx.chain,
        tx.symbol,
        tx.direction,
        tx.amount,
        tx.status,
        tx.counterparty,
        tx.hash,
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "royal-chain-wallet-transactions.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  if (!wallet) {
    return (
      <div className="px-5 pb-10 pt-10">
        <h1 className="font-display text-2xl font-bold">Transaction Activity</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create or import a wallet before tracking transaction activity.
        </p>
        <Link
          to="/create-wallet"
          className="mt-5 grid h-12 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy"
        >
          Create a wallet
        </Link>
        <Link
          to="/import-wallet"
          className="mt-2 grid h-12 place-items-center rounded-xl border border-border bg-card text-sm font-semibold"
        >
          Import a wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pb-10 pt-10">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Transaction Activity</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Real transaction hashes recorded by this app session.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={records.length === 0}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Export transactions as CSV"
          title={
            records.length ? "Export visible transactions as CSV" : "No transactions to export"
          }
        >
          <Download className="h-4 w-4" />
        </button>
      </header>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-input/40 px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search asset, chain, address, or hash"
          className="w-full bg-transparent py-3 text-sm focus:outline-none"
        />
      </div>

      <div className="mt-4 flex gap-2">
        {(
          [
            ["all", "All"],
            ["out", "Sent"],
            ["in", "Received"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setDirection(value)}
            aria-pressed={direction === value}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${direction === value ? "border-gold bg-gold/10 text-gold" : "border-border bg-card"}`}
          >
            {label}
          </button>
        ))}
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="ml-auto max-w-32 rounded-full border border-border bg-card px-3 py-2 text-xs"
          aria-label="Filter by transaction status"
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="mt-5 space-y-2">
        {query.isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Loading transaction activity…
          </div>
        ) : query.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
            Transaction activity could not be loaded. Refresh and try again.
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-7 text-center">
            <Wallet className="mx-auto h-8 w-8 text-gold" />
            <h2 className="mt-3 font-display text-lg font-bold">No matching transactions</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Historical on-chain activity requires a transaction indexer. This screen will not
              fabricate receipts, hashes, or deposits.
            </p>
            <Link
              to="/app/receive"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-gold hover:underline"
            >
              Receive crypto <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          records.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: TxRecord }) {
  const explorer =
    tx.chain === "bitcoin"
      ? `https://mempool.space/tx/${tx.hash}`
      : tx.chain === "ethereum"
        ? `https://etherscan.io/tx/${tx.hash}`
        : tx.chain === "bnb"
          ? `https://bscscan.com/tx/${tx.hash}`
          : `https://solscan.io/tx/${tx.hash}`;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tx.direction === "in" ? "bg-success/10 text-success" : "bg-gold/10 text-gold"}`}
      >
        {tx.direction === "in" ? (
          <ArrowDownLeft className="h-5 w-5" />
        ) : (
          <ArrowUpRight className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">
              {tx.direction === "in" ? "Received" : "Sent"} {tx.symbol}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {tx.chain} · {new Date(tx.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-sm font-bold">
              {tx.direction === "in" ? "+" : "−"}
              {tx.amount} {tx.symbol}
            </p>
            <p
              className={`mt-1 text-[10px] font-semibold ${tx.status === "confirmed" ? "text-success" : tx.status === "failed" ? "text-destructive" : "text-amber-600"}`}
            >
              {tx.status}
            </p>
          </div>
        </div>
        <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">{tx.hash}</p>
        {tx.hash && (
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-gold hover:underline"
          >
            View on explorer <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
