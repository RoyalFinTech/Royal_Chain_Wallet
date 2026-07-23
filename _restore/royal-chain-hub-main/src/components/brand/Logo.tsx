import { LOGO_URL } from "@/lib/logo";

export function Logo({
  size = 64,
  className = "",
  withText = false,
}: {
  size?: number;
  className?: string;
  withText?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={LOGO_URL}
        alt="Royal Chain Wallet"
        width={size}
        height={size}
        className="object-contain drop-shadow-[0_8px_24px_rgba(212,162,76,0.35)]"
        style={{ width: size, height: size }}
      />
      {withText && (
        <span className="font-display text-lg font-bold tracking-tight">
          <span className="text-gold">Royal</span>Chain
        </span>
      )}
    </div>
  );
}
