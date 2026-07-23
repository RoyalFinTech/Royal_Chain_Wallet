import { ArrowDownLeft, ArrowUpRight, Receipt, Smartphone, Landmark, Wallet } from "lucide-react";
import { formatMoney, type Transaction, type TxType } from "@/lib/mock-data";

const iconFor = (t: TxType) => {
  switch (t) {
    case "received":
      return ArrowDownLeft;
    case "sent":
      return ArrowUpRight;
    case "bill":
      return Receipt;
    case "airtime":
      return Smartphone;
    case "deposit":
      return Wallet;
    case "withdraw":
      return Landmark;
  }
};

export function TransactionCard({ tx }: { tx: Transaction }) {
  const Icon = iconFor(tx.type);
  const isIn = tx.amount > 0;
  const statusStyles = {
    completed: "bg-success/15 text-success",
    pending: "bg-gold/15 text-gold",
    failed: "bg-destructive/15 text-destructive",
  }[tx.status];

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-soft">
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${isIn ? "bg-success/10 text-success" : "bg-primary/5 text-primary"}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{tx.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {tx.subtitle} · {tx.date}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${isIn ? "text-success" : "text-foreground"}`}>
          {isIn ? "+" : "−"}
          {formatMoney(tx.amount)}
        </p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyles}`}
        >
          {tx.status}
        </span>
      </div>
    </div>
  );
}
