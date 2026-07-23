import { AlertTriangle, ShieldCheck } from "lucide-react";

export function SecurityWarning({
  variant = "warning",
  title,
  children,
}: {
  variant?: "warning" | "safe";
  title: string;
  children?: React.ReactNode;
}) {
  const isSafe = variant === "safe";
  const Icon = isSafe ? ShieldCheck : AlertTriangle;
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-3 text-xs ${
        isSafe
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/5 text-destructive"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <p className="mt-0.5 opacity-90">{children}</p>}
      </div>
    </div>
  );
}
