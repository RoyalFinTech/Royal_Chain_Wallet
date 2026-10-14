import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ImageIcon, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useStoredWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/app/nfts")({
  component: NftsPage,
});

function NftsPage() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();

  if (!wallet) {
    return (
      <div className="px-5 pb-10 pt-10">
        <h1 className="font-display text-2xl font-bold">Collectibles</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create or import a wallet to continue.</p>
        <Link
          to="/create-wallet"
          className="mt-5 grid h-12 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy"
        >
          Create wallet
        </Link>
        <Link
          to="/import-wallet"
          className="mt-2 grid h-12 place-items-center rounded-xl border border-border bg-card text-sm font-semibold"
        >
          Import wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pb-10 pt-10">
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Back to dashboard"
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">Collectibles</h1>
          <p className="text-xs text-muted-foreground">NFT support on Solana</p>
        </div>
        <Logo size={34} />
      </header>

      <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold/10 text-gold">
          <ImageIcon className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold">NFT indexing is not connected</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This build does not yet read Solana NFT token accounts or metadata from a verified
          indexer. It will not invent collectibles or claim to transfer them. Your wallet keys are
          unchanged.
        </p>
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-left text-xs leading-5 text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            NFT receiving and transfer actions will be enabled after indexer, metadata, ownership,
            and signed transaction paths are implemented and tested.
          </p>
        </div>
        <Link
          to="/app"
          className="mt-5 grid h-12 place-items-center rounded-xl gradient-gold text-sm font-semibold text-navy shadow-glow"
        >
          Back to wallet
        </Link>
      </div>
    </div>
  );
}
