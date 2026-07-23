/**
 * WalletConnect session management — pairing, approval, and request
 * routing to this wallet's real on-device signer.
 *
 * CONFIDENCE NOTE: built against my knowledge of the WalletKit API
 * surface (session_proposal/session_request events, pair/approveSession/
 * rejectSession/respondSessionRequest methods), which is the same shape
 * @walletconnect/web3wallet has used for a couple of years. I cannot
 * verify this compiles-and-runs against a live relay connection or a
 * real dapp from this environment — see docs/WALLETCONNECT.md for what
 * to test once deployed.
 */
import { getWalletKit } from "./client";
import { EVM_CAIP2, BASE_CAIP2, SOLANA_CAIP2 } from "./chains";
import type { DerivedAddresses } from "@/lib/wallet/derive";
import { sendAndConfirm, signMessage } from "@/lib/wallet/signing";
import { logSecurityEvent } from "@/lib/security/audit";
import { AppError } from "@/lib/errors/types";

export interface PendingProposal {
  id: number;
  dappName: string;
  dappUrl: string;
  dappIcon: string | null;
  requestedChains: string[]; // CAIP-2 ids the dapp asked for
}

export interface PendingRequest {
  id: number;
  topic: string;
  method: string; // e.g. 'eth_sendTransaction', 'personal_sign', 'solana_signTransaction'
  chainId: string; // CAIP-2
  params: unknown;
  dappName: string;
}

/** Builds the CAIP-10 account strings ("eip155:1:0xabc...") this wallet can offer for approval. */
function buildApprovedAccounts(addresses: DerivedAddresses): Record<string, string[]> {
  const eip155Accounts = [
    `${EVM_CAIP2.ethereum}:${addresses.ethereum.address}`,
    `${EVM_CAIP2.bnb}:${addresses.bnb.address}`,
    `${EVM_CAIP2.polygon}:${addresses.ethereum.address}`, // Polygon shares the Ethereum address
    `${BASE_CAIP2}:${addresses.ethereum.address}`, // Base shares the Ethereum address
  ];
  const solanaAccounts = [`${SOLANA_CAIP2.mainnet}:${addresses.solana.address}`];
  return { eip155: eip155Accounts, solana: solanaAccounts };
}

export async function onSessionProposal(
  callback: (proposal: PendingProposal) => void,
): Promise<() => void> {
  const kit = await getWalletKit();
  const handler = (event: unknown) => {
    const e = event as {
      id: number;
      params: {
        proposer: { metadata: { name: string; url: string; icons: string[] } };
        requiredNamespaces: Record<string, { chains?: string[] }>;
      };
    };
    const chains = Object.values(e.params.requiredNamespaces).flatMap((ns) => ns.chains ?? []);
    callback({
      id: e.id,
      dappName: e.params.proposer.metadata.name,
      dappUrl: e.params.proposer.metadata.url,
      dappIcon: e.params.proposer.metadata.icons[0] ?? null,
      requestedChains: chains,
    });
  };
  kit.on("session_proposal", handler);
  return () => kit.off("session_proposal", handler);
}

export async function onSessionRequest(
  callback: (request: PendingRequest) => void,
): Promise<() => void> {
  const kit = await getWalletKit();
  const handler = (event: unknown) => {
    const e = event as {
      id: number;
      topic: string;
      params: { chainId: string; request: { method: string; params: unknown } };
    };
    const sessions = kit.getActiveSessions();
    const session = (
      sessions as Record<string, { topic: string; peer: { metadata: { name: string } } }>
    )[e.topic];
    callback({
      id: e.id,
      topic: e.topic,
      method: e.params.request.method,
      chainId: e.params.chainId,
      params: e.params.request.params,
      dappName: session?.peer.metadata.name ?? "Unknown dapp",
    });
  };
  kit.on("session_request", handler);
  return () => kit.off("session_request", handler);
}

export async function pairWithUri(uri: string): Promise<void> {
  const kit = await getWalletKit();
  await kit.pair({ uri });
}

/** Approves a session proposal, offering every chain/account this wallet supports. */
export async function approveProposal(
  proposalId: number,
  addresses: DerivedAddresses,
): Promise<void> {
  const kit = await getWalletKit();
  const { buildApprovedNamespaces } = await import("@walletconnect/utils");
  const accounts = buildApprovedAccounts(addresses);

  // Cast through unknown: the exact proposal shape comes from the SDK's
  // internal event payload, which this module doesn't re-type — see
  // confidence note at the top of this file.
  const proposal = (
    kit as unknown as { getPendingSessionProposals: () => Record<number, unknown> }
  ).getPendingSessionProposals()[proposalId];
  if (!proposal) throw new AppError("not_found", "This connection request has expired.");

  const namespaces = buildApprovedNamespaces({
    proposal: (proposal as { params: unknown }).params as never,
    supportedNamespaces: {
      eip155: {
        chains: [EVM_CAIP2.ethereum, EVM_CAIP2.bnb, EVM_CAIP2.polygon, BASE_CAIP2],
        methods: ["eth_sendTransaction", "personal_sign", "eth_signTypedData_v4"],
        events: ["chainChanged", "accountsChanged"],
        accounts: accounts.eip155,
      },
      solana: {
        chains: [SOLANA_CAIP2.mainnet],
        methods: ["solana_signTransaction", "solana_signMessage"],
        events: [],
        accounts: accounts.solana,
      },
    },
  });

  await kit.approveSession({ id: proposalId, namespaces });
  logSecurityEvent("walletconnect.session_approved", String(proposalId));
}

export async function rejectProposal(proposalId: number): Promise<void> {
  const kit = await getWalletKit();
  await kit.rejectSession({
    id: proposalId,
    reason: { code: 5000, message: "User rejected the connection." },
  });
  logSecurityEvent("walletconnect.session_rejected", String(proposalId));
}

export async function disconnectSession(topic: string): Promise<void> {
  const kit = await getWalletKit();
  await kit.disconnectSession({ topic, reason: { code: 6000, message: "User disconnected." } });
  logSecurityEvent("walletconnect.session_disconnected", topic);
}

export async function listActiveSessions(): Promise<
  { topic: string; dappName: string; dappUrl: string }[]
> {
  const kit = await getWalletKit();
  const sessions = kit.getActiveSessions();
  return Object.values(sessions).map((s) => {
    const session = s as { topic: string; peer: { metadata: { name: string; url: string } } };
    return {
      topic: session.topic,
      dappName: session.peer.metadata.name,
      dappUrl: session.peer.metadata.url,
    };
  });
}

/**
 * Approves a signing/send request by routing it through this wallet's
 * REAL on-device signer (lib/wallet/signing.ts) — the mnemonic is
 * supplied by the caller (after PIN unlock, same pattern as every send
 * flow already in this app) and never touches WalletConnect's relay or
 * any server. This is the point where the non-custodial guarantee is
 * either preserved or broken; it must never sign with anything other
 * than a key derived transiently from the user's own decrypted mnemonic.
 */
export async function approveRequest(
  request: PendingRequest,
  mnemonic: string,
  fromAddress: string,
): Promise<void> {
  const kit = await getWalletKit();
  let result: unknown;

  if (request.method === "personal_sign" || request.method === "solana_signMessage") {
    const chain = request.chainId.startsWith("solana") ? "solana" : "ethereum";
    const message = extractMessageFromParams(request.params);
    result = await signMessage(mnemonic, chain === "solana" ? "solana" : "ethereum", message);
  } else if (
    request.method === "eth_sendTransaction" ||
    request.method === "solana_signTransaction"
  ) {
    const chainId: import("@/lib/wallet/derive").ChainId = request.chainId.startsWith("solana")
      ? "solana"
      : request.chainId === EVM_CAIP2.bnb
        ? "bnb"
        : "ethereum";
    const { to, value } = extractTxFromParams(request.params);
    const send = await sendAndConfirm({
      chain: chainId,
      mnemonic,
      fromAddress,
      toAddress: to,
      amount: value,
    });
    result = send.txHash;
  } else {
    throw new AppError("validation_error", `Unsupported WalletConnect method: ${request.method}`);
  }

  await kit.respondSessionRequest({
    topic: request.topic,
    response: { id: request.id, jsonrpc: "2.0", result },
  });
  logSecurityEvent("walletconnect.request_approved", request.topic, { method: request.method });
}

export async function rejectRequest(request: PendingRequest): Promise<void> {
  const kit = await getWalletKit();
  await kit.respondSessionRequest({
    topic: request.topic,
    response: {
      id: request.id,
      jsonrpc: "2.0",
      error: { code: 5000, message: "User rejected the request." },
    },
  });
  logSecurityEvent("walletconnect.request_rejected", request.topic, { method: request.method });
}

function extractMessageFromParams(params: unknown): string {
  // personal_sign params: [messageHex, address]. solana_signMessage: { message: base58/utf8 }.
  if (Array.isArray(params) && typeof params[0] === "string") return params[0];
  if (typeof params === "object" && params && "message" in params)
    return String((params as { message: unknown }).message);
  throw new AppError("validation_error", "Could not parse the message to sign.");
}

function extractTxFromParams(params: unknown): { to: string; value: number } {
  // eth_sendTransaction params: [{ to, value (hex wei), ... }]. Amount conversion is a
  // placeholder — a real implementation needs full hex-wei -> ether parsing per asset decimals.
  if (Array.isArray(params) && typeof params[0] === "object") {
    const p = params[0] as { to?: string; value?: string };
    return { to: p.to ?? "", value: p.value ? Number(BigInt(p.value)) / 1e18 : 0 };
  }
  throw new AppError("validation_error", "Could not parse the transaction request.");
}
