// Royal Wallet Identity System
// Deterministic mock identity used across the frontend. Ready to be swapped
// with a real blockchain / KMS-backed identity provider on the backend.

export interface RoyalWalletIdentity {
  walletId: string; // RCW-XXXX-XXXX
  address: string; // 0x……
  recoveryPhrase: string[]; // 12 words
  createdAt: string;
}

const WORDS = [
  "royal",
  "chain",
  "wallet",
  "secure",
  "vault",
  "harbor",
  "signal",
  "orbit",
  "cipher",
  "lantern",
  "compass",
  "ember",
  "meadow",
  "silver",
  "granite",
  "aurora",
  "falcon",
  "delta",
  "echo",
  "juniper",
  "kestrel",
  "onyx",
  "quartz",
  "sable",
  "titan",
  "verse",
  "willow",
  "zenith",
  "nomad",
  "cobalt",
  "ivory",
  "prism",
  "harvest",
  "canyon",
  "phoenix",
  "atlas",
  "beacon",
  "quantum",
  "nova",
  "solstice",
  "helix",
  "borealis",
  "monarch",
  "regal",
  "sterling",
  "ledger",
  "keystone",
  "obelisk",
];

const HEX = "0123456789abcdef";

function pick<T>(arr: T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function randHex(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
}

export function generateWalletIdentity(): RoyalWalletIdentity {
  const walletId = `RCW-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const address = `0x${randHex(4)}...${randHex(4).toUpperCase()}`;
  return {
    walletId,
    address,
    recoveryPhrase: pick(WORDS, 12),
    createdAt: new Date().toISOString(),
  };
}

// Default identity shown across demo screens.
export const DEMO_IDENTITY: RoyalWalletIdentity = {
  walletId: "RCW-8392-9282",
  address: "0x8F92...72KD",
  recoveryPhrase: [
    "royal",
    "chain",
    "harbor",
    "cipher",
    "orbit",
    "aurora",
    "falcon",
    "willow",
    "zenith",
    "ember",
    "keystone",
    "phoenix",
  ],
  createdAt: "2026-01-01T00:00:00Z",
};

export function shortAddress(addr: string) {
  return addr.length > 14 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
