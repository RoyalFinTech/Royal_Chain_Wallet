/**
 * Staking service — SOL delegation-style staking and ROY native staking.
 *
 * Currently backed by deterministic mock data (seeded by wallet address so
 * a wallet's positions/rewards are stable across reloads). To go live:
 * SOL -> real stake accounts via @solana/web3.js StakeProgram; ROY -> the
 * Royal Token staking program via Anchor. Function signatures below are
 * the integration contract and should not change.
 */
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
  unlockAt: number | null; // ms epoch, null if active/liquid
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

const VALIDATORS: Validator[] = [
  {
    id: "val-royal",
    name: "Royal FinTech Validator",
    apyPct: 7.8,
    commissionPct: 5,
    totalStakedUsd: 4_820_000,
    uptimePct: 99.98,
  },
  {
    id: "val-atlas",
    name: "Atlas Stake Pool",
    apyPct: 7.2,
    commissionPct: 7,
    totalStakedUsd: 12_400_000,
    uptimePct: 99.95,
  },
  {
    id: "val-summit",
    name: "Summit Node Co.",
    apyPct: 6.9,
    commissionPct: 8,
    totalStakedUsd: 8_100_000,
    uptimePct: 99.91,
  },
  {
    id: "val-gambia",
    name: "Gambia Community Pool",
    apyPct: 7.5,
    commissionPct: 4,
    totalStakedUsd: 1_260_000,
    uptimePct: 99.87,
  },
];

const ROY_APY = 12.4;
const SOL_UNSTAKE_DAYS = 2; // epoch cooldown, approximated
const ROY_UNSTAKE_DAYS = 7;

function seed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function rand(s: number) {
  let a = s;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function getValidators(): Promise<Validator[]> {
  return VALIDATORS;
}

export async function getStakingSummary(address: string): Promise<StakeSummary[]> {
  const r = rand(seed(`${address}:staking-summary`));
  const solStaked = Number((r() * 40).toFixed(2));
  const royStaked = Number((r() * 6000).toFixed(0));
  return [
    {
      symbol: "SOL",
      staked: solStaked,
      rewards: Number((solStaked * 0.031).toFixed(4)),
      apyPct: 7.6,
      unstakingPeriodDays: SOL_UNSTAKE_DAYS,
    },
    {
      symbol: "ROY",
      staked: royStaked,
      rewards: Number((royStaked * 0.018).toFixed(2)),
      apyPct: ROY_APY,
      unstakingPeriodDays: ROY_UNSTAKE_DAYS,
    },
  ];
}

export async function getPositions(address: string): Promise<StakePosition[]> {
  const r = rand(seed(`${address}:positions`));
  const count = 1 + Math.floor(r() * 3);
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const symbol: "SOL" | "ROY" = r() > 0.5 ? "SOL" : "ROY";
    const validator =
      symbol === "SOL"
        ? VALIDATORS[Math.floor(r() * VALIDATORS.length)].name
        : "Royal Token Staking Program";
    const unstaking = r() > 0.8;
    const amount = Number(
      (r() * (symbol === "SOL" ? 20 : 3000) + 1).toFixed(symbol === "SOL" ? 3 : 0),
    );
    const price = symbol === "SOL" ? 148 : 0.42;
    return {
      id: `pos_${address.slice(0, 6)}_${i}`,
      symbol,
      validator,
      amount,
      usdValue: Number((amount * price).toFixed(2)),
      apyPct: symbol === "SOL" ? 7.2 + r() * 0.8 : ROY_APY,
      status: unstaking ? "unstaking" : "active",
      unlockAt: unstaking
        ? now +
          Math.floor(r() * (symbol === "SOL" ? SOL_UNSTAKE_DAYS : ROY_UNSTAKE_DAYS)) * 86_400_000
        : null,
      startedAt: now - Math.floor(r() * 120) * 86_400_000,
    };
  });
}

export async function getRewardHistory(address: string): Promise<RewardEvent[]> {
  const r = rand(seed(`${address}:rewards`));
  const now = Date.now();
  return Array.from({ length: 10 }, (_, i) => {
    const symbol: "SOL" | "ROY" = r() > 0.5 ? "SOL" : "ROY";
    const amount = Number((r() * (symbol === "SOL" ? 0.4 : 60)).toFixed(symbol === "SOL" ? 4 : 2));
    const price = symbol === "SOL" ? 148 : 0.42;
    return {
      id: `rw_${address.slice(0, 6)}_${i}`,
      symbol,
      amount,
      usdValue: Number((amount * price).toFixed(2)),
      timestamp: now - i * 2 * 86_400_000 - Math.floor(r() * 86_400_000),
      claimed: i > 1,
    };
  });
}

export async function stake(opts: {
  symbol: "SOL" | "ROY";
  amount: number;
  validatorId?: string;
}): Promise<{ txHash: string }> {
  await new Promise((res) => setTimeout(res, 900));
  void opts;
  return {
    txHash: Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
  };
}

export async function unstake(positionId: string): Promise<{ txHash: string }> {
  await new Promise((res) => setTimeout(res, 900));
  void positionId;
  return {
    txHash: Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
  };
}

export async function claimRewards(
  symbol: "SOL" | "ROY",
): Promise<{ txHash: string; claimedUsd: number }> {
  await new Promise((res) => setTimeout(res, 700));
  return {
    txHash: Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    claimedUsd: symbol === "SOL" ? 4.1 : 12.6,
  };
}
