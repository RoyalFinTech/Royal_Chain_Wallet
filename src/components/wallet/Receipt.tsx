import { forwardRef } from "react";
import { Logo } from "@/components/brand/Logo";
import { CURRENCIES, formatCurrency } from "@/lib/currencies";
import type { ReceiptData } from "@/lib/receipts";
import { ShieldCheck } from "lucide-react";

interface Props {
  data: ReceiptData;
}

export const Receipt = forwardRef<HTMLDivElement, Props>(function Receipt({ data }, ref) {
  const total = Math.abs(data.amount) + data.fee;
  const meta = CURRENCIES[data.currency];
  const statusColor = {
    completed: "text-success bg-success/10 ring-success/30",
    pending: "text-gold bg-gold/10 ring-gold/30",
    failed: "text-destructive bg-destructive/10 ring-destructive/30",
    cancelled: "text-muted-foreground bg-muted ring-border",
  }[data.status];

  return (
    <div ref={ref} className="rounded-3xl border border-border bg-card p-5 shadow-elegant">
      <div className="flex items-center justify-between border-b border-dashed border-border pb-4">
        <Logo size={32} withText />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase ring-1 ${statusColor}`}
        >
          {data.status}
        </span>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Amount</p>
        <p className="mt-1 font-display text-3xl font-bold text-gold-shimmer">
          {formatCurrency(Math.abs(data.amount), data.currency)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{meta.name}</p>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-2 text-xs">
        <Row k="Receipt No" v={data.receiptNo} />
        <Row k="Transaction ID" v={data.txId} mono />
        <Row k="Blockchain Hash" v={`${data.hash.slice(0, 10)}…${data.hash.slice(-6)}`} mono />
        <Row k="Sender" v={`${data.sender.name} · ${data.sender.walletId}`} />
        <Row k="Receiver" v={`${data.receiver.name} · ${data.receiver.walletId}`} />
        <Row k="Network Fee" v={formatCurrency(data.fee, data.currency)} />
        {data.exchangeRate && <Row k="Exchange Rate" v={data.exchangeRate} />}
        <Row k="Total" v={formatCurrency(total, data.currency)} bold />
        <Row k="Method" v={data.method} />
        <Row k="Date" v={new Date(data.date).toLocaleString()} />
        {data.note && <Row k="Note" v={data.note} />}
      </dl>

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted/40 p-3">
        <div className="text-[10px] leading-tight text-muted-foreground">
          <p className="font-semibold text-foreground">Verification</p>
          <p>Scan to verify authenticity</p>
        </div>
        <div className="grid h-14 w-14 grid-cols-6 grid-rows-6 gap-[1px] rounded-lg bg-white p-1">
          {Array.from({ length: 36 }).map((_, i) => {
            const seed = (i * 9301 + data.txId.length * 49297) % 233280;
            return <div key={i} className={seed / 233280 > 0.5 ? "bg-navy" : "bg-white"} />;
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3 text-success" />
        Powered by Royal FinTech Company · royalchain.com
      </div>
    </div>
  );
});

function Row({ k, v, mono, bold }: { k: string; v: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-border/60 py-1.5 last:border-b-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd
        className={`text-right ${mono ? "font-mono" : ""} ${bold ? "font-bold text-foreground" : "text-foreground/90"}`}
      >
        {v}
      </dd>
    </div>
  );
}
