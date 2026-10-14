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
import { deriveAllChains, type DerivedAddresses } from "@/lib/wallet/derive";
import { signMessage } from "@/lib/wallet/signing";
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
        // Transaction and typed-data methods stay disabled until this wallet
        // can faithfully validate and sign the exact requested payload.
        methods: ["personal_sign"],
        events: ["chainChanged", "accountsChanged"],
        accounts: accounts.eip155,
      },
      solana: {
        chains: [SOLANA_CAIP2.mainnet],
        // Serialized Solana transaction signing is not implemented safely yet.
        methods: ["solana_signMessage"],
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
): Promise<void> {
  const kit = await getWalletKit();
  let result: unknown;

  if (request.method === "personal_sign" || request.method === "solana_signMessage") {
    const addresses = await deriveAllChains(mnemonic);
    const isSolana = request.method === "solana_signMessage" && request.chainId.startsWith("solana");

    if (isSolana) {
      const params = request.params as { pubkey?: unknown } | null;
      if (
        !params ||
        typeof params !== "object" ||
        typeof params.pubkey !== "string" ||
        params.pubkey !== addresses.solana.address
      ) {
        throw new AppError("validation_error", "Requested Solana signing address does not match this wallet.");
      }
    } else {
      if (
        !Array.isArray(request.params) ||
        typeof request.params[1] !== "string" ||
        request.params[1].toLowerCase() !== addresses.ethereum.address.toLowerCase()
      ) {
        throw new AppError("validation_error", "Requested EVM signing address does not match this wallet.");
      }
    }

    const chain = isSolana ? "solana" : "ethereum";
    const message = await extractMessageFromParams(request.params, chain);
    result = await signMessage(mnemonic, chain, message);
  } else {
    // In particular, do not turn eth_sendTransaction or the serialized
    // solana_signTransaction payload into a new native transfer. Such a
    // shortcut can sign/broadcast a different action than the dapp requested.
    throw new AppError(
      "validation_error",
      `WalletConnect method ${request.method} is not supported safely yet. Reject this request.`,
    );
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

async function extractMessageFromParams(
  params: unknown,
  chain: "solana" | "ethereum" | "bnb",
): Promise<string | Uint8Array> {
  // EVM personal_sign uses [hexData, address]. Sign the decoded bytes, not
  // the UTF-8 characters of a 0x-prefixed hex string.
  if (chain !== "solana" && Array.isArray(params) && typeof params[0] === "string") {
    const payload = params[0];
    if (payload.startsWith("0x")) {
      const hex = payload.slice(2);
      if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
        throw new AppError("validation_error", "The personal_sign message is not valid hex data.");
      }
      return Uint8Array.from(hex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
    }
    return payload;
  }

  // The WalletConnect Solana adapter transmits its signMessage payload in
  // base58 under params.message. Decode it back to the original bytes before
  // signing, rather than signing the base58 text itself.
  if (chain === "solana" && typeof params === "object" && params !== null && "message" in params) {
    const message = (params as { message?: unknown }).message;
    if (typeof message !== "string" || message.length === 0) {
      throw new AppError("validation_error", "Could not parse the Solana message to sign.");
    }
    const bs58 = (await import("bs58")).default;
    try {
      return bs58.decode(message);
    } catch {
      throw new AppError("validation_error", "The Solana message is not valid base58 data.");
    }
  }

  throw new AppError("validation_error", "Could not parse the message to sign.");
}
