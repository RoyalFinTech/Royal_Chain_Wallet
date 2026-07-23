import { createFileRoute, Link } from "@tanstack/react-router";
import { COUNTRIES } from "@/lib/mock-data";

export const Route = createFileRoute("/auth/forgot")({
  component: Forgot,
});

function Forgot() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      <h1 className="font-display text-2xl font-bold">Reset your PIN</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your registered phone number to receive an OTP.
      </p>

      <form className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Phone number</span>
          <div className="mt-1 flex overflow-hidden rounded-2xl border border-border bg-input/40">
            <select className="border-r border-border bg-transparent px-3 text-sm focus:outline-none">
              {COUNTRIES.map((c) => (
                <option key={c.code}>
                  {c.flag} {c.dial}
                </option>
              ))}
            </select>
            <input
              type="tel"
              required
              placeholder="3xx xxx xxx"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm focus:outline-none"
            />
          </div>
        </label>

        <Link
          to="/auth/otp"
          className="grid h-14 w-full place-items-center rounded-2xl gradient-gold font-semibold text-navy shadow-glow transition hover:scale-[1.01]"
        >
          Send reset code
        </Link>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/auth/login" className="font-semibold text-gold hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
}
