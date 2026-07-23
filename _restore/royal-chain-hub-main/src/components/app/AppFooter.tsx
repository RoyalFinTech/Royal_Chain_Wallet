import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="mt-10 border-t border-border/60 bg-gradient-to-b from-transparent to-muted/40 px-5 pb-28 pt-8 text-center text-xs text-muted-foreground">
      <p className="font-display text-sm text-foreground">
        Powered by <span className="text-gold">Royal FinTech Company</span>
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link to="/legal/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link to="/legal/terms" className="hover:text-foreground">
          Terms
        </Link>
        <span aria-hidden>·</span>
        <Link to="/support" className="hover:text-foreground">
          Support
        </Link>
        <span aria-hidden>·</span>
        <Link to="/about" className="hover:text-foreground">
          About
        </Link>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-[10px]">
        <span>© {new Date().getFullYear()} Royal Chain Wallet</span>
        <Link
          to="/admin/login"
          aria-label="Restricted admin access"
          title="Admin"
          className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground/60 transition hover:text-gold"
        >
          <Shield className="h-3.5 w-3.5" />
        </Link>
      </div>
    </footer>
  );
}
