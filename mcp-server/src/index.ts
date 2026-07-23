#!/usr/bin/env node
/**
 * Royal Chain Wallet MCP server.
 *
 * Exposes wallet/admin operations as MCP tools over stdio, backed by
 * Supabase (PostgREST) — never a direct PostgreSQL connection. See
 * tools.ts for the security boundary around create_wallet/import_wallet/
 * send_transaction (non-custodial: no key material ever passes through
 * this process).
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema as rawZodToJsonSchema } from "zod-to-json-schema";
import type { z } from "zod";

/**
 * Every schema below is a z.object(...), so the JSON Schema output is
 * always `{ type: "object", properties, required? }` at runtime — the
 * library's inferred TS type is a broader union than that (it also
 * covers string/number/etc. schemas), so this narrows it to what the
 * MCP SDK's Tool.inputSchema actually expects.
 */
function toMcpInputSchema(schema: z.ZodTypeAny): Tool["inputSchema"] {
  return rawZodToJsonSchema(schema) as Tool["inputSchema"];
}
import * as tools from "./tools.js";

const TOOLS: Tool[] = [
  {
    name: "create_wallet",
    description:
      "Start a new non-custodial wallet creation flow (opens the app; never generates keys server-side).",
    inputSchema: toMcpInputSchema(tools.CreateWalletInput),
  },
  {
    name: "import_wallet",
    description:
      "Start a wallet import flow (opens the app; recovery phrase is never entered here).",
    inputSchema: toMcpInputSchema(tools.ImportWalletInput),
  },
  {
    name: "get_balance",
    description: "Get balances for a wallet's accounts across all chains.",
    inputSchema: toMcpInputSchema(tools.GetBalanceInput),
  },
  {
    name: "get_transactions",
    description: "Get recent transactions for a wallet.",
    inputSchema: toMcpInputSchema(tools.GetTransactionsInput),
  },
  {
    name: "send_transaction",
    description:
      "Pre-fill a send flow for user confirmation and on-device signing (never signs/broadcasts server-side).",
    inputSchema: toMcpInputSchema(tools.SendTransactionInput),
  },
  {
    name: "search_user",
    description: "[Admin] Search users by email or display name.",
    inputSchema: toMcpInputSchema(tools.SearchUserInput),
  },
  {
    name: "admin_dashboard",
    description: "[Admin] Get platform-wide summary metrics.",
    inputSchema: toMcpInputSchema(tools.AdminDashboardInput),
  },
  {
    name: "database_status",
    description: "[Admin] Check database reachability and migration status.",
    inputSchema: toMcpInputSchema(tools.DatabaseStatusInput),
  },
];

const server = new Server(
  { name: "royal-chain-wallet", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await dispatch(name, args ?? {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
  }
});

async function dispatch(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "create_wallet":
      return tools.createWallet(tools.CreateWalletInput.parse(args));
    case "import_wallet":
      return tools.importWallet(tools.ImportWalletInput.parse(args));
    case "get_balance":
      return tools.getBalance(tools.GetBalanceInput.parse(args));
    case "get_transactions":
      return tools.getTransactions(tools.GetTransactionsInput.parse(args));
    case "send_transaction":
      return tools.sendTransaction(tools.SendTransactionInput.parse(args));
    case "search_user":
      return tools.searchUser(tools.SearchUserInput.parse(args));
    case "admin_dashboard":
      return tools.adminDashboard();
    case "database_status":
      return tools.databaseStatus();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Royal Chain Wallet MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
