/**
 * Deterministic multi-chain key derivation from a single BIP-39 mnemonic.
 *
 * One recovery phrase -> one address per chain, following the standard
 * derivation paths used by Phantom / Trust Wallet / MetaMask so imports
 * from those wallets resolve to the same addresses.
 *
 *   Bitcoin  m/44'/0'/0'/0/0    (P2WPKH, bech32)
 *   Ethereum m/44'/60'/0'/0/0
 *   BNB Chain — same path/address as Ethereum (EVM-compatible)
 *   Solana   m/44'/501'/0'/0'
 *
 * Browser-only. Private keys never leave the device.
 */
import { Buffer } from "buffer";
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { HDNodeWallet, Mnemonic as EthersMnemonic } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import { BIP32Factory } from "bip32";
import * as ecc from "@bitcoinerlab/secp256k1";
import { derivePath as edDerivePath } from "ed25519-hd-key";

const bip32 = BIP32Factory(ecc);

export type ChainId = "bitcoin" | "ethereum" | "bnb" | "solana";

export interface ChainAddress {
  chain: ChainId;
  address: string;
  publicKey: string; // hex
}

export interface DerivedAddresses {
  bitcoin: ChainAddress;
  ethereum: ChainAddress;
  bnb: ChainAddress;
  solana: ChainAddress;
}

function deriveBitcoin(seed: Buffer): ChainAddress {
  const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
  const child = root.derivePath("m/44'/0'/0'/0/0");
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network: bitcoin.networks.bitcoin,
  });
  return {
    chain: "bitcoin",
    address: address!,
    publicKey: Buffer.from(child.publicKey).toString("hex"),
  };
}

function deriveEvm(mnemonic: string): { ethereum: ChainAddress; bnb: ChainAddress } {
  const m = EthersMnemonic.fromPhrase(mnemonic);
  const wallet = HDNodeWallet.fromMnemonic(m, "m/44'/60'/0'/0/0");
  const shared: ChainAddress = {
    chain: "ethereum",
    address: wallet.address,
    publicKey: wallet.publicKey,
  };
  return {
    ethereum: shared,
    // BNB Chain is EVM-compatible: identical derivation path & address.
    bnb: { ...shared, chain: "bnb" },
  };
}

function deriveSolana(seed: Buffer): ChainAddress {
  const { key } = edDerivePath("m/44'/501'/0'/0'", seed.toString("hex"));
  const keypair = nacl.sign.keyPair.fromSeed(key);
  return {
    chain: "solana",
    address: bs58.encode(keypair.publicKey),
    publicKey: Buffer.from(keypair.publicKey).toString("hex"),
  };
}

export async function deriveAllChains(mnemonic: string): Promise<DerivedAddresses> {
  const seed = await bip39.mnemonicToSeed(mnemonic); // Buffer
  const btc = deriveBitcoin(seed);
  const { ethereum, bnb } = deriveEvm(mnemonic);
  const sol = deriveSolana(seed);
  return { bitcoin: btc, ethereum, bnb, solana: sol };
}

// Re-exported so callers don't need to know which underlying lib does what.
export function generateMnemonic(strength: 128 | 256 = 128): string {
  // 128 bits -> 12 words, 256 bits -> 24 words
  return bip39.generateMnemonic(strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic.trim().toLowerCase());
}
