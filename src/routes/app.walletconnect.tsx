import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Link2, X, Check, Loader2, ShieldAlert, Globe, Plug } from "lucide-react";
import { useStoredWallet } from "@/hooks/use-wallet";
import { unlockWallet } from "@/lib/wallet";
import { isWalletConnectConfigured } from "@/lib/walletconnect/client";
import {
  pairWithUri,
  onSessionProposal,
  onSessionRequest,
  approveProposal,
  rejectProposal,
  approveRequest,
  rejectRequest,
  listActiveSessions,
  disconnectSession,
  type PendingProposal,
  type PendingRequest,
} from "@/lib/walletconnect/session-manager";

export const Route = createFileRoute("/app/walletconnect")({
  component: WalletConnectPage,
});

function WalletConnectPage() {
  const navigate = useNavigate();
  const wallet = useStoredWallet();
  const configured = isWalletConnectConfigured();

  const [uri, setUri] = useState("");
  const [pairing, setPairing] = useState(false);
  const [proposal, setProposal] = useState<PendingProposal | null>(null);
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [sessions, setSessions] = useState<{ topic: string; dappName: string; dappUrl: string }[]>(
    [],
  );
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let unsubProposal: (() => void) | undefined;
    let unsubRequest: (() => void) | undefined;
    (async () => {
      try {
        unsubProposal = await onSessionProposal(setProposal);
        unsubRequest = await onSessionRequest(setRequest);
        setSessions(await listActiveSessions());
      } catch (e) {
        console.error("WalletConnect init failed:", e);
      }
    })();
    return () => {
      unsubProposal?.();
      unsubRequest?.();
    };
  }, [configured]);

  async function connect() {
    if (!uri.trim()) return;
    setPairing(true);
    try {
      await pairWithUri(uri.trim());
      setUri("");
      toast.success("Pairing request sent — waiting for the dapp to respond.");
    } catch (e) {
      toast.error("Pairing failed", {
        description: e instanceof Error ? e.message : "Invalid URI.",
      });
    } finally {
      setPairing(false);
    }
  }

  async function handleApproveProposal() {
    if (!proposal || !wallet) return;
    setBusy(true);
    try {
      await approveProposal(proposal.id, wallet.addresses);
      toast.success(`Connected to ${proposal.dappName}`);
      setProposal(null);
      setSessions(await listActiveSessions());
    } catch (e) {
      toast.error("Connection failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function handleRejectProposal() {
    if (!proposal) return;
    await rejectProposal(proposal.id);
    setProposal(null);
  }

  async function handleApproveRequest() {
    if (!request || !wallet) return;
    setBusy(true);
    try {
      const { mnemonic } = await unlockWallet(wallet, pin);
      const fromAddress = request.chainId.startsWith("solana")
        ? wallet.addresses.solana.address
        : wallet.addresses.ethereum.address;
      await approveRequest(request, mnemonic, fromAddress);
      toast.success("Request approved");
      setRequest(null);
      setPin("");
    } catch (e) {
      toast.error("Approval failed", {
        description: e instanceof Error ? e.message : "Incorrect PIN.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRejectRequest() {
    if (!request) return;
    await rejectRequest(request);
    setRequest(null);
    setPin("");
  }

  if (!wallet) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-xl font-bold">No wallet yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create or import a wallet to connect to dapps.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-14">
      <header className="flex items-center gap-3 px-5 pt-10">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="grid h-10 w-10 place-items-center rounded-full glass"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-xl font-bold">WalletConnect</h1>
      </header>

      <div className="px-5 pt-6">
        {!configured ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-6 text-center">
            <ShieldAlert className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">Not configured</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set{" "}
              <code className="rounded bg-muted px-1 py-0.5">VITE_WALLETCONNECT_PROJECT_ID</code> to
              enable connecting to dapps. Get a free project ID at{" "}
              <span className="font-medium">cloud.reown.com</span>.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-border bg-card p-4">
              <label className="text-xs font-medium text-muted-foreground">
                Paste a WalletConnect URI
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                  placeholder="wc:a1b2c3...@2?relay-protocol=irn&symKey=..."
                  className="h-11 flex-1 rounded-xl border border-border bg-input/40 px-3 font-mono text-xs"
                />
                <button
                  onClick={() => void connect()}
                  disabled={!uri.trim() || pairing}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-gold text-navy shadow-glow disabled:opacity-50"
                >
                  {pairing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Copy the "Connect Wallet" URI from a dapp, or scan its QR code with{" "}
                <button
                  onClick={() => navigate({ to: "/qr" })}
                  className="text-gold hover:underline"
                >
                  the scanner
                </button>
                .
              </p>
            </div>

            <div className="mt-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Connected Apps
              </h2>
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active connections.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={s.topic}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/10 text-gold">
                        <Globe className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{s.dappName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{s.dappUrl}</p>
                      </div>
                      <button
                        onClick={() =>
                          void disconnectSession(s.topic).then(async () =>
                            setSessions(await listActiveSessions()),
                          )
                        }
                        className="text-xs font-semibold text-destructive"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {proposal && (
        <div
          className="fixed inset-0 z-50 grid items-end bg-black/60"
          onClick={() => setProposal(null)}
        >
          <div
            className="w-full rounded-t-3xl border-t border-border bg-card p-5 sm:mx-auto sm:mb-auto sm:mt-16 sm:max-w-md sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Connection Request</p>
              <button
                onClick={() => setProposal(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-gold">
                <Plug className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold">{proposal.dappName}</p>
                <p className="text-xs text-muted-foreground">{proposal.dappUrl}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              This app wants to see your public address and request transaction approvals. It cannot
              move funds without your explicit approval and PIN each time.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => void handleRejectProposal()}
                className="grid h-12 flex-1 place-items-center rounded-2xl border border-border bg-card text-sm font-semibold"
              >
                Decline
              </button>
              <button
                onClick={() => void handleApproveProposal()}
                disabled={busy}
                className="grid h-12 flex-1 place-items-center rounded-2xl gradient-gold text-sm font-semibold text-navy shadow-glow disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {request && (
        <div
          className="fixed inset-0 z-50 grid items-end bg-black/60"
          onClick={() => setRequest(null)}
        >
          <div
            className="w-full rounded-t-3xl border-t border-border bg-card p-5 sm:mx-auto sm:mb-auto sm:mt-16 sm:max-w-md sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Signature Request</p>
              <button
                onClick={() => setRequest(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm">
              {request.dappName} is requesting{" "}
              <span className="font-mono text-xs">{request.method}</span>
            </p>
            <label className="mt-4 block text-xs font-medium text-muted-foreground">
              Enter your PIN to approve
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-14 w-full rounded-2xl border border-border bg-input/40 text-center font-display text-2xl tracking-[0.5em]"
              placeholder="••••••"
            />
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => void handleRejectRequest()}
                className="grid h-12 flex-1 place-items-center rounded-2xl border border-border bg-card text-sm font-semibold"
              >
                Reject
              </button>
              <button
                onClick={() => void handleApproveRequest()}
                disabled={pin.length !== 6 || busy}
                className="grid h-12 flex-1 place-items-center rounded-2xl gradient-gold text-sm font-semibold text-navy shadow-glow disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1.5 inline h-4 w-4" />
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
