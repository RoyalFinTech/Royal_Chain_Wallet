# Royal Chain Wallet — API Documentation

Royal Chain Wallet doesn't run a separate REST API server. It uses
**TanStack Start server functions** (`src/server/*.ts`) — these compile
into real HTTP endpoints under the hood, but are called with normal
function-call syntax from the client, with auth headers attached
automatically (see `src/integrations/supabase/auth-attacher.ts`).

All endpoints require a valid Supabase session (`Authorization: Bearer
<access_token>`) except where noted. Admin endpoints additionally require
an active row in `admin_users`.

## Authentication

Handled directly by `@supabase/supabase-js` (`src/lib/auth/providers/supabase-auth.ts`), not a custom endpoint:

| Operation | Function |
|---|---|
| Sign up | `supabase.auth.signUp(email, password)` |
| Sign in | `supabase.auth.signInWithPassword(email, password)` |
| Sign out | `supabase.auth.signOut()` |
| Password reset | `supabase.auth.resetPasswordForEmail(email)` |
| Email verification | Automatic, if enabled in Supabase project Auth settings |

## Wallet — `src/server/wallet.ts`

| Function | Method | Input | Description |
|---|---|---|---|
| `listWallets` | GET | — | List the caller's wallets |
| `getWalletAccounts` | GET | `{ walletId }` | List chain accounts for a wallet (ownership-checked) |
| `createWalletRecord` | POST | `{ label?, accounts[] }` | Register a wallet's public addresses (never the mnemonic) |

## Transactions — `src/server/transactions.ts`

| Function | Method | Input | Description |
|---|---|---|---|
| `listTransactions` | GET | `{ walletId, limit? }` | Recent transactions for a wallet |
| `recordTransaction` | POST | `{ walletId, assetId, chain, direction, amount, ... }` | Record a transaction (rate-limited: 20/min/user) |

## Assets — `src/server/assets.ts`

| Function | Method | Input | Description |
|---|---|---|---|
| `listAssets` | GET | — | List active supported assets |

## Portfolio — `src/server/portfolio.ts`

| Function | Method | Input | Description |
|---|---|---|---|
| `getPortfolio` | GET | — | Aggregate USD-valued balances across all the caller's wallets |

## Settings — `src/server/settings.ts`

| Function | Method | Input | Description |
|---|---|---|---|
| `getSettings` | GET | — | Get preferred currency/locale/KYC status |
| `updateSettings` | POST | `{ preferredCurrency?, preferredLocale? }` | Update preferences |

## Notifications — `src/server/notifications.ts`

| Function | Method | Input | Description |
|---|---|---|---|
| `listNotifications` | GET | `{ unreadOnly?, limit? }` | List notifications |
| `markNotificationRead` | POST | `{ notificationId }` | Mark one as read |
| `markAllNotificationsRead` | POST | — | Mark all as read |

## Security — `src/server/security.ts`

| Function | Method | Input | Description |
|---|---|---|---|
| `listSessions` | GET | — | List active (non-revoked) sessions |
| `revokeSession` | POST | `{ sessionId }` | Revoke a session |
| `listDevices` | GET | — | List registered devices |
| `removeDevice` | POST | `{ deviceId }` | Remove a device |

## Admin — `src/server/admin.ts` (requires `admin_users` row)

| Function | Method | Input | Description |
|---|---|---|---|
| `adminListUsers` | GET | `{ query?, page?, pageSize? }` | Paginated user search |
| `adminDashboardSummary` | GET | — | Platform-wide summary counts |
| `adminGetAuditLog` | GET | `{ limit? }` | Recent audit log entries |
| `adminFlagUser` | POST | `{ userId, reason, amountUsd? }` | Create a fraud case + audit log entry |

## Errors

Every endpoint throws a plain `Error` with a human-readable message on
failure (auth failure, ownership check failure, Supabase error, etc).
There is no structured error envelope on the server-function transport
layer today — `src/lib/errors/types.ts`'s `AppError` hierarchy is used
client-side and in the mock service layer, but server functions haven't
been wired to throw `AppError` subclasses specifically. See
`docs/REMAINING_WORK.md`.

## MCP Server

A separate MCP server (`mcp-server/`) exposes 8 tools over stdio for
agent-driven access. See `mcp-server/README.md` for the full tool list
and the non-custodial security boundary around wallet operations.
