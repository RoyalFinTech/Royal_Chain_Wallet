/**
 * Private-key derivation for signing.
 *
 * Deliberately kept separate from derive.ts (which only ever returns
 * public addresses and is safe to call widely). Everything in this file
 * returns raw private key material — callers must use it transiently
 * (sign one thing, discard) and never persist, log, or transmit the
 * result. This file, and everything downstream of it, runs on-device
 * only; nothing here ever touches the network or Supabase.
 *
 * Browser-only.
 */
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import { HDNodeWallet, Mnemonic as EthersMnemonic } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import { BIP32Factory } from "bip32";
import * as ecc from "@bitcoinerlab/secp256k1";
import { derivePath as edDerivePath } from "ed25519-hd-key";
import type { ChainId } from "./derive";

const bip32 = BIP32Factory(ecc);

export interface SolanaSigningKey {
  chain: "solana";
  secretKey: Uint8Array; // 64-byte nacl secret key (includes public key)
  publicKey: Uint8Array;
}

export interface EvmSigningKey {
  chain: "ethereum" | "bnb" | "polygon" | "base";
  privateKeyHex: string; // 0x-prefixed
  address: string;
}

export interface BitcoinSigningKey {
  chain: "bitcoin";
  /** Satisfies bitcoinjs-lib's Signer interface directly (has .publicKey and .sign()). */
  signer: ReturnType<typeof bip32.fromSeed>;
  address: string;
}

export async function deriveSolanaSigningKey(mnemonic: string): Promise<SolanaSigningKey> {
  const seed = await bip39.mnemonicToSeed(mnemonic.trim());
  const { key } = edDerivePath("m/44'/501'/0'/0'", seed.toString("hex"));
  const keypair = nacl.sign.keyPair.fromSeed(key);
  return { chain: "solana", secretKey: keypair.secretKey, publicKey: keypair.publicKey };
}

/** Ethereum, BNB, Polygon, and Base all share the same EVM key (see lib/config/evm-networks.ts). */
export async function deriveEvmSigningKey(mnemonic: string): Promise<EvmSigningKey> {
  const m = EthersMnemonic.fromPhrase(mnemonic.trim());
  const wallet = HDNodeWallet.fromMnemonic(m, "m/44'/60'/0'/0/0");
  return { chain: "ethereum", privateKeyHex: wallet.privateKey, address: wallet.address };
}

export async function deriveBitcoinSigningKey(mnemonic: string): Promise<BitcoinSigningKey> {
  const seed = await bip39.mnemonicToSeed(mnemonic.trim());
  const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
  const child = root.derivePath("m/44'/0'/0'/0/0");
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network: bitcoin.networks.bitcoin,
  });
  return { chain: "bitcoin", signer: child, address: address! };
}

export function chainFamily(chain: ChainId): "solana" | "evm" | "bitcoin" {
  if (chain === "solana") return "solana";
  if (chain === "bitcoin") return "bitcoin";
  return "evm"; // ethereum, bnb (and polygon/base at the network-registry layer)
}
