/**
 * Staking service contract.
 *
 * No on-chain staking program or audited stake transaction path is connected
 * in this build. Read methods return empty sets (not generated sample
 * positions), and write methods fail closed instead of fabricating hashes.
 */
import { NotConfiguredError } from "@/lib/errors/types";
import type { StakeSummary } from "./types";

export interface Validator {
  id: string;
  name: string;
  apyPct: number;
  commissionPct: number;
  totalStakedUsd: number;
  uptimePct: number;
}

export interface StakePosition {
  id: string;
  symbol: "SOL" | "ROY";
  validator: string;
  amount: number;
  usdValue: number;
  apyPct: number;
  status: "active" | "unstaking";
  unlockAt: number | null;
  startedAt: number;
}

export interface RewardEvent {
  id: string;
  symbol: "SOL" | "ROY";
  amount: number;
  usdValue: number;
  timestamp: number;
  claimed: boolean;
}

export async function getValidators(): Promise<Validator[]> {
  return [];
}

export async function getStakingSummary(_address: string): Promise<StakeSummary[]> {
  return [];
}

export async function getPositions(_address: string): Promise<StakePosition[]> {
  return [];
}

export async function getRewardHistory(_address: string): Promise<RewardEvent[]> {
  return [];
}

export async function stake(_opts: {
  symbol: "SOL" | "ROY";
  amount: number;
  validatorId?: string;
}): Promise<{ txHash: string }> {
  throw new NotConfiguredError("Verified on-chain staking program");
}

export async function unstake(_positionId: string): Promise<{ txHash: string }> {
  throw new NotConfiguredError("Verified on-chain unstaking program");
}

export async function claimRewards(
  _symbol: "SOL" | "ROY",
): Promise<{ txHash: string; claimedUsd: number }> {
  throw new NotConfiguredError("Verified on-chain reward-claim instruction");
}
