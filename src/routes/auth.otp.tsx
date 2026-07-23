import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth/otp")({
  component: Otp,
});

function Otp() {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [seconds, setSeconds] = useState(45);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (digits.every((d) => d !== "")) {
      const t = setTimeout(() => navigate({ to: "/app" }), 500);
      return () => clearTimeout(t);
    }
  }, [digits, navigate]);

  const setDigit = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-gold text-navy shadow-glow">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold">Verify your phone</h1>
      <p className="mt-1 text-sm text-muted-foreground">We sent a 6-digit code to your number.</p>

      <div className="mt-6 flex justify-center gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            maxLength={1}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
            }}
            className="h-14 w-11 rounded-2xl border border-border bg-input/40 text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-gold/60"
          />
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {seconds > 0 ? (
          <>
            Resend code in <span className="font-semibold text-foreground">{seconds}s</span>
          </>
        ) : (
          <button
            onClick={() => setSeconds(45)}
            className="font-semibold text-gold hover:underline"
          >
            Resend OTP
          </button>
        )}
      </p>

      <button
        onClick={() => navigate({ to: "/app" })}
        className="mt-6 grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow transition hover:scale-[1.01]"
      >
        Verify & Continue
      </button>
    </div>
  );
}
