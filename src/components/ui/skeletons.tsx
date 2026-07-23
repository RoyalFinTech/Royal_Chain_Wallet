import { cn } from "@/lib/utils";

/**
 * Reusable shimmer-based skeleton primitives used across every
 * network-fetching screen. Swap `isLoading` for real query flags
 * when the backend is wired.
 */

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/60",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent",
        "before:animate-[shimmer_1.6s_infinite]",
        className,
      )}
    />
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <Shimmer className={cn("h-3 w-full rounded-full", className)} />;
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <Shimmer className={cn("h-11 w-11 rounded-full", className)} />;
}

export function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
      <SkeletonCircle />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3 w-2/3" />
        <SkeletonLine className="h-2.5 w-1/2 opacity-70" />
      </div>
      <div className="space-y-2 text-right">
        <SkeletonLine className="ml-auto h-3 w-16" />
        <SkeletonLine className="ml-auto h-2.5 w-10 opacity-70" />
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading transactions">
      {Array.from({ length: rows }).map((_, i) => (
        <TransactionSkeleton key={i} />
      ))}
    </div>
  );
}

export function WalletCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-3 w-20" />
        <SkeletonLine className="h-3 w-12" />
      </div>
      <Shimmer className="mt-6 h-9 w-3/5" />
      <Shimmer className="mt-3 h-3 w-2/5 opacity-70" />
      <div className="mt-8 flex items-center gap-2">
        <Shimmer className="h-8 w-24 rounded-full" />
        <Shimmer className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function QrSkeleton({ size = 224 }: { size?: number }) {
  return (
    <div
      className="mx-auto grid place-items-center rounded-2xl bg-white p-4 shadow-soft"
      style={{ width: size, height: size }}
      aria-busy="true"
      aria-label="Generating QR code"
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-muted/70">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-navy/10 to-transparent" />
        <div className="absolute left-2 top-2 h-6 w-6 rounded-md border-2 border-navy/30" />
        <div className="absolute right-2 top-2 h-6 w-6 rounded-md border-2 border-navy/30" />
        <div className="absolute bottom-2 left-2 h-6 w-6 rounded-md border-2 border-navy/30" />
      </div>
    </div>
  );
}

export function CardRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <SkeletonCircle className="h-10 w-10" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3 w-1/3" />
        <SkeletonLine className="h-2.5 w-1/4 opacity-70" />
      </div>
      <SkeletonLine className="h-4 w-16" />
    </div>
  );
}

export function CurrencyChipSkeleton() {
  return (
    <div className="shrink-0 rounded-2xl border border-border bg-card px-3 py-2">
      <SkeletonLine className="h-2.5 w-10" />
      <SkeletonLine className="mt-1.5 h-3 w-16" />
    </div>
  );
}

/**
 * Full Royal wallet balance card skeleton — mirrors WalletCard layout
 * so the swap from loading → loaded is visually stable.
 */
export function WalletBalanceSkeleton() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 text-white shadow-elegant gradient-royal"
      aria-busy="true"
      aria-label="Loading wallet balance"
    >
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0 space-y-2">
          <Shimmer className="h-2.5 w-24 bg-white/15" />
          <Shimmer className="h-3 w-32 bg-white/15" />
          <Shimmer className="h-2.5 w-40 bg-white/10" />
        </div>
        <Shimmer className="h-6 w-20 rounded-full bg-white/10" />
      </div>
      <div className="relative mt-7 space-y-3">
        <div className="flex items-center justify-between">
          <Shimmer className="h-2.5 w-28 bg-white/15" />
          <Shimmer className="h-6 w-16 rounded-full bg-white/10" />
        </div>
        <Shimmer className="h-9 w-3/5 rounded-lg bg-white/15" />
      </div>
      <div className="relative mt-6 flex items-center justify-between">
        <Shimmer className="h-2.5 w-16 bg-white/10" />
        <Shimmer className="h-2.5 w-20 bg-white/10" />
      </div>
    </div>
  );
}

/**
 * Account summary widget skeleton — used for pockets / vaults /
 * insight tiles on the wallet home.
 */
export function AccountSummarySkeleton({ tiles = 3 }: { tiles?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2" aria-busy="true" aria-label="Loading account summary">
      {Array.from({ length: tiles }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-3 text-center">
          <SkeletonLine className="mx-auto h-2 w-14" />
          <SkeletonLine className="mx-auto mt-2 h-3 w-10" />
          <SkeletonLine className="mx-auto mt-2 h-2 w-12 opacity-70" />
        </div>
      ))}
    </div>
  );
}

export function InsightCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-4">
      <SkeletonLine className="h-2.5 w-20" />
      <SkeletonLine className="mt-2 h-5 w-24" />
      <SkeletonLine className="mt-2 h-2.5 w-14 opacity-70" />
      <Shimmer className="mt-3 h-16 w-full rounded-xl" />
    </div>
  );
}
