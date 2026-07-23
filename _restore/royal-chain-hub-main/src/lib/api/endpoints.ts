/**
 * API endpoint path registry (Module 8).
 * Paths only — base URL comes from VITE_API_BASE_URL at call time.
 */
export const API_ENDPOINTS = {
  wallet: {
    create: "/v1/wallets",
    list: (userId: string) => `/v1/users/${userId}/wallets`,
    balances: (walletId: string) => `/v1/wallets/${walletId}/balances`,
  },
  transactions: {
    send: "/v1/transactions",
    history: (walletId: string) => `/v1/wallets/${walletId}/transactions`,
    byHash: (hash: string) => `/v1/transactions/hash/${hash}`,
  },
  swap: {
    quote: "/v1/swap/quote",
    execute: "/v1/swap/execute",
    history: (walletId: string) => `/v1/wallets/${walletId}/swaps`,
  },
  staking: {
    validators: "/v1/staking/validators",
    positions: (walletId: string) => `/v1/wallets/${walletId}/staking/positions`,
    stake: "/v1/staking/stake",
    unstake: (positionId: string) => `/v1/staking/positions/${positionId}/unstake`,
    claim: (positionId: string) => `/v1/staking/positions/${positionId}/claim`,
  },
  price: {
    quote: "/v1/prices",
  },
  notifications: {
    list: (userId: string) => `/v1/users/${userId}/notifications`,
    markRead: (id: string) => `/v1/notifications/${id}/read`,
    registerPushToken: "/v1/notifications/push-token",
  },
  auth: {
    signUp: "/v1/auth/sign-up",
    signIn: "/v1/auth/sign-in",
    signOut: "/v1/auth/sign-out",
    resetPassword: "/v1/auth/reset-password",
  },
  admin: {
    users: "/v1/admin/users",
    auditLog: "/v1/admin/audit-log",
    treasury: "/v1/admin/treasury",
    analytics: "/v1/admin/analytics",
  },
} as const;
