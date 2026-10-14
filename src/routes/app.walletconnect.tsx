import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import bs58 from "bs58";
import { toast } from "sonner";
import { ArrowLeft, Link2, X, Check, Loader2, ShieldAlert, Globe, Plug, Camera } from "lucide-react";
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

type BrowserQrDetector = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
};
type BrowserQrDetectorConstructor = new (options: { formats: string[] }) => BrowserQrDetector;

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
  const [scanning, setScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<BrowserQrDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const requestSupported =
    !!request && ["personal_sign", "solana_signMessage"].includes(request.method);
  const requestMessage = request && requestSupported ? getMessagePreview(request) : null;

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

  async function startQrScan() {
    const Detector = (window as Window & { BarcodeDetector?: BrowserQrDetectorConstructor })
      .BarcodeDetector;
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanNotice("Camera access is unavailable here. Paste the WalletConnect URI manually.");
      return;
    }
    if (!Detector) {
      setScanNotice("This browser does not support native QR decoding. Paste the WalletConnect URI manually.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Camera preview could not be initialized.");
      }
      streamRef.current = stream;
      detectorRef.current = new Detector({ formats: ["qr_code"] });
      video.srcObject = stream;
      await video.play();
      setScanNotice("Point the camera at the WalletConnect QR code. Scanning does not approve a connection.");
      setScanning(true);
    } catch (e) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      detectorRef.current = null;
      setScanning(false);
      setScanNotice(e instanceof Error ? e.message : "Could not start camera scanning.");
    }
  }

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;

    const scanNextFrame = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (video && detector && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          const results = await detector.detect(video);
          const rawValue = results.find((item) => item.rawValue)?.rawValue;
          if (rawValue) {
            if (/^wc:[^?\s]+@2\?/.test(rawValue)) {
              setUri(rawValue);
              setScanNotice("WalletConnect URI scanned. Review it, then tap Connect to send the pairing request.");
              setScanning(false);
              return;
            }
            setScanNotice("A QR code was detected, but it is not a WalletConnect v2 URI. Scan the dapp's Connect Wallet QR or paste the URI.");
          }
        } catch (e) {
          console.warn("[walletconnect] QR detection failed:", e);
        }
      }
      if (!cancelled) scanTimerRef.current = window.setTimeout(() => void scanNextFrame(), 350);
    };

    void scanNextFrame();
    return () => {
      cancelled = true;
      if (scanTimerRef.current !== null) window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      detectorRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [scanning]);

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
    if (!requestSupported) {
      toast.error("This WalletConnect signing method is not supported safely yet. Reject the request.");
      return;
    }
    setBusy(true);
    try {
      const { mnemonic } = await unlockWallet(wallet, pin);
      await approveRequest(request, mnemonic);
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void startQrScan()}
                  disabled={scanning || pairing}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-xs font-semibold disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" /> {scanning ? "Scanning…" : "Scan QR with camera"}
                </button>
                {scanning && (
                  <button
                    type="button"
                    onClick={() => setScanning(false)}
                    className="h-10 rounded-xl border border-border px-3 text-xs font-semibold"
                  >
                    Stop camera
                  </button>
                )}
              </div>
              <div className={scanning ? "mt-3 block overflow-hidden rounded-xl border border-border bg-black" : "hidden"}>
                <video ref={videoRef} autoPlay playsInline muted className="max-h-72 w-full object-contain" />
              </div>
              {scanNotice && (
                <p role="status" className="mt-2 break-words text-[11px] text-muted-foreground">
                  {scanNotice}
                </p>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Paste the URI or scan a dapp's WalletConnect v2 QR. Scanning only reads the pairing URI; you must still review and approve the connection.
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
              This app can see the public account addresses you approve. This build supports message-signing requests only; transaction signing and sending remain disabled until they can be validated safely.
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
            {!requestSupported ? (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                This method is not supported safely in this build. Do not approve it; reject the request. No transaction will be sent by this wallet.
              </div>
            ) : (
              <>
                <div className="mt-3 rounded-2xl border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Network</p>
                  <p className="mt-1 break-all font-mono text-xs">{request.chainId}</p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Address requested</p>
                  <p className="mt-1 break-all font-mono text-xs">{requestMessage?.address ?? "Not supplied by the dApp"}</p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Exact message to sign</p>
                  <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-background p-3 font-mono text-xs">{requestMessage?.message ?? "Unable to decode this message safely."}</pre>
                  {requestMessage?.warning && <p className="mt-2 text-[11px] text-amber-700">{requestMessage.warning}</p>}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground">View raw request parameters</summary>
                    <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-background p-2 font-mono text-[10px]">{JSON.stringify(request.params, null, 2)}</pre>
                  </details>
                </div>
                <label className="mt-4 block text-xs font-medium text-muted-foreground">
                  Enter your PIN to approve this message signature
                </label>
              </>
            )}
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
                disabled={pin.length !== 6 || busy || !requestSupported}
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
type MessagePreview = { message: string; address: string | null; warning?: string };

function getMessagePreview(request: PendingRequest): MessagePreview {
  const decodeText = (bytes: Uint8Array): { message: string; warning?: string } => {
    const message = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const replacementCount = (message.match(/\\uFFFD/g) ?? []).length;
    const controlCount = Array.from(message).filter(
      (char) => char.charCodeAt(0) < 32 && char !== "\\n" && char !== "\\r" && char !== "\\t",
    ).length;
    if (replacementCount > 0 || controlCount > 0) {
      return {
        message: `Binary or non-text message (\\${bytes.length} bytes). Review the raw request parameters below before deciding.`,
        warning: "The message is not clean readable UTF-8. Do not approve unless you understand the raw payload.",
      };
    }
    const maxLength = 4000;
    return {
      message: message.length > maxLength ? `${message.slice(0, maxLength)}\\n… [truncated in view; signing uses the complete payload]` : message,
      warning: message.length > maxLength ? "Only the first 4,000 characters are shown; the signature covers the complete message." : undefined,
    };
  };

  if (request.method === "personal_sign" && Array.isArray(request.params)) {
    const payload = request.params[0];
    const address = typeof request.params[1] === "string" ? request.params[1] as string : null;
    if (typeof payload !== "string") {
      return { message: "Unsupported message parameters.", address, warning: "This request will not be signed." };
    }
    if (/^0x[0-9a-fA-F]*$/.test(payload) && payload.length % 2 === 0) {
      const hex = payload.slice(2);
      const bytes = Uint8Array.from(hex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
      return { ...decodeText(bytes), address };
    }
    return { ...decodeText(new TextEncoder().encode(payload)), address };
  }

  if (
    request.method === "solana_signMessage" &&
    typeof request.params === "object" && request.params !== null && "message" in request.params
  ) {
    const params = request.params as { message?: unknown; pubkey?: unknown };
    const address = typeof params.pubkey === "string" ? params.pubkey : null;
    if (typeof params.message !== "string" || params.message.length === 0) {
      return { message: "Unsupported message parameters.", address, warning: "This request will not be signed." };
    }
    try {
      return { ...decodeText(bs58.decode(params.message)), address };
    } catch {
      return { message: "Could not decode the Solana message.", address, warning: "Reject this request because the message payload could not be decoded." };
    }
  }

  return { message: "Unsupported method.", address: null, warning: "This request will not be signed." };
}

