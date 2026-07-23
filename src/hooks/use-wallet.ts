/**
 * React hooks around the on-device multi-chain wallet + demo chain data.
 */
import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadWallet, type StoredWallet } from "@/lib/wallet";
import { walletService, transactionService, type AssetSymbol } from "@/lib/services";

/* ---------- Reactive access to the locally stored wallet ---------- */

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("rcw:wallet-changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("rcw:wallet-changed", handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot(): StoredWallet | null {
  return loadWallet();
}

function getServerSnapshot(): StoredWallet | null {
  return null;
}

export function useStoredWallet(): StoredWallet | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* -------------------- Portfolio & chain data ---------------------- */

const REFETCH_INTERVAL = 30_000;

export function usePortfolio(wallet: StoredWallet | null | undefined) {
  return useQuery({
    queryKey: ["portfolio", wallet?.addresses.solana.address],
    enabled: !!wallet,
    refetchInterval: REFETCH_INTERVAL,
    queryFn: () => walletService.getPortfolio(wallet!.addresses),
  });
}

export function useTransactionHistory(
  wallet: StoredWallet | null | undefined,
  symbols: AssetSymbol[] = ["BTC", "ETH", "BNB", "SOL", "ROY", "USDT", "USDC"],
) {
  const address = wallet?.addresses.solana.address;
  return useQuery({
    queryKey: ["tx-history", address, symbols.join(",")],
    enabled: !!wallet,
    refetchInterval: REFETCH_INTERVAL,
    queryFn: () => transactionService.getHistory(address!, symbols),
  });
}
