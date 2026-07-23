import { X, Download, Share2, Flag, RotateCcw } from "lucide-react";
import { Receipt } from "./Receipt";
import type { ReceiptData } from "@/lib/receipts";
import { useEffect } from "react";

interface Props {
  data: ReceiptData | null;
  onClose: () => void;
}

export function TransactionDetailsSheet({ data, onClose }: Props) {
  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  if (!data) return null;

  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.receiptNo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const text = `${data.receiptNo} · ${data.txId}`;
    try {
      if (navigator.share) await navigator.share({ title: "Royal Chain Receipt", text });
      else await navigator.clipboard.writeText(text);
    } catch {
      /* user cancel */
    }
  };

  return (
    <div
      className="motion-backdrop-enter fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="motion-sheet-enter mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-border bg-background p-5 shadow-elegant"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Transaction Details</h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Receipt data={data} />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={download}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold"
          >
            <Download className="h-4 w-4 text-gold" /> Download
          </button>
          <button
            onClick={share}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold"
          >
            <Share2 className="h-4 w-4 text-gold" /> Share
          </button>
          <button className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold">
            <Flag className="h-4 w-4 text-destructive" /> Report
          </button>
          <button className="flex items-center justify-center gap-2 rounded-2xl gradient-gold py-3 text-sm font-semibold text-navy shadow-glow">
            <RotateCcw className="h-4 w-4" /> Repeat
          </button>
        </div>
      </div>
    </div>
  );
}
