import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Coins, Flame, Lock, Send } from "lucide-react";
import { AdminPageHeader, AdminCard, StatTile, NoAccess } from "@/components/admin/AdminLayout";
import { useAdminRole, canAccess } from "@/lib/admin/roles";
import { tokenContractAddress } from "@/lib/config/tokens";
import { isChainLive } from "@/lib/config/chains";

export const Route = createFileRoute("/admin/token")({
  component: AdminToken,
});

function AdminToken() {
  const { role } = useAdminRole();
  if (!canAccess(role, "token")) return <NoAccess section="ROY Token Management" />;

  const mintAddress = tokenContractAddress("ROY");
  const hasLiveSolanaRpc = isChainLive("solana");
  // A configured mint address alone is not sufficient to enable mint/burn.
  // Token instruction signing, authority checks and audited program setup
  // must all exist before an admin action can touch real assets.
  const mintControlsReady = false;

  const stats = [
    { label: "ROY mint address", value: mintAddress ? `${mintAddress.slice(0, 6)}…${mintAddress.slice(-5)}` : "Not configured", icon: Coins },
    { label: "On-chain supply", value: "Not queried", icon: Lock },
    { label: "Holder index", value: "Not connected", icon: Send },
    { label: "Solana RPC", value: hasLiveSolanaRpc ? "Configured" : "Not configured", icon: AlertTriangle },
  ];

  return (
    <div>
      <AdminPageHeader title="ROY Token Management" subtitle="Royal Token · planned Solana SPL token" />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <StatTile key={item.label} {...item} />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> Minting is not ready
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This repository does not yet have a verified live ROY mint, an audited mint-authority/multisig flow, on-chain supply reads, or tested SPL mint instructions. Controls stay disabled so the dashboard cannot imply a mint or burn has happened.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="font-display text-base font-bold">Pre-mint checklist</h2>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Mint address and network", mintAddress ? "Configured value found; verify it on the intended network" : "Not configured"],
              ["Decimals and supply cap", "Decision and configuration required"],
              ["Mint authority and multisig", "Secure authority model not implemented"],
              ["Metadata, logo and URI", "On-chain metadata not deployed"],
              ["Testnet mint and verification", "Not tested"],
              ["Mainnet deployment review", "Blocked until all previous checks pass"],
            ].map(([label, status]) => (
              <div key={label} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-b-0">
                <span className="font-medium">{label}</span>
                <span className="max-w-[55%] text-right text-xs text-muted-foreground">{status}</span>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-base font-bold">Mint controls</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Buttons remain disabled until the mint program, token address, admin authorization, and audit checks are implemented and tested on devnet.
          </p>
          <label className="mt-4 block">
            <span className="text-xs font-medium text-muted-foreground">Amount (ROY)</span>
            <input
              disabled={!mintControlsReady}
              inputMode="decimal"
              placeholder="Minting unavailable"
              className="mt-1 h-11 w-full rounded-xl border border-border bg-input/40 px-3 text-sm disabled:opacity-60"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={!mintControlsReady}
              title="Burn is disabled until the token program and authorization checks are verified."
              className="grid h-11 flex-1 place-items-center gap-1.5 rounded-xl border border-border bg-card text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Flame className="mr-1 inline h-3.5 w-3.5" /> Burn
            </button>
            <button
              type="button"
              disabled={!mintControlsReady}
              title="Mint is disabled until the token program and authorization checks are verified."
              className="grid h-11 flex-1 place-items-center gap-1.5 rounded-xl gradient-gold text-xs font-semibold text-navy shadow-glow disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Coins className="mr-1 inline h-3.5 w-3.5" /> Mint
            </button>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
