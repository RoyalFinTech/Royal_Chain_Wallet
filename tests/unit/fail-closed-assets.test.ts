import { describe, expect, it } from "vitest";
import { mockNetworkStatus, sampleMarketData } from "@/lib/services/mockData";
import { getTokenBalances } from "@/lib/services/tokenService";
import { submitTransfer } from "@/lib/services/transactionService";

describe("fail-closed crypto asset services", () => {
  it("returns sample market metadata without inventing an asset balance", () => {
    const sample = sampleMarketData("BTC");
    expect(sample.symbol).toBe("BTC");
    expect(sample.usdPrice).toBe(64200);
    expect(sample.change24hPct).toBe(0);
    expect(sample).not.toHaveProperty("amount");
    expect(sample).not.toHaveProperty("usdValue");
  });

  it("labels missing network data as disconnected rather than fabricating height or fees", () => {
    const status = mockNetworkStatus("solana");
    expect(status.label).toBe("Not connected");
    expect(status.blockHeight).toBe(0);
    expect(status.avgFeeUsd).toBe(0);
  });

  it("returns no SPL token balances before a real reader is configured", async () => {
    await expect(getTokenBalances("AnySolanaAddress")).resolves.toEqual([]);
  });

  it("rejects malformed amounts before attempting a send", async () => {
    await expect(
      submitTransfer({
        fromAddress: "sender",
        toAddress: "recipient",
        symbol: "ETH",
        chain: "ethereum",
        amount: 0,
        usdValue: 0,
        mnemonic: "not-used-because-amount-is-invalid",
      }),
    ).rejects.toMatchObject({ code: "validation_error" });
  });

  it("rejects transfers without an unlocked recovery phrase", async () => {
    await expect(
      submitTransfer({
        fromAddress: "sender",
        toAddress: "recipient",
        symbol: "ETH",
        chain: "ethereum",
        amount: 0.01,
        usdValue: 1,
      }),
    ).rejects.toMatchObject({ code: "unauthorized" });
  });

  it("blocks SPL-token transfers instead of simulating a token send", async () => {
    await expect(
      submitTransfer({
        fromAddress: "sender",
        toAddress: "recipient",
        symbol: "ROY",
        chain: "solana",
        amount: 1,
        usdValue: 0.42,
        mnemonic: "not-used-because-token-transfers-are-disabled",
      }),
    ).rejects.toMatchObject({ code: "not_configured" });
  });
});
