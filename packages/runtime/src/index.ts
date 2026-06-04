/**
 * luminaweb-runtime — public surface.
 *
 * This package ships three entrypoints:
 *   - zapdev/server  : capsule, query, mutation, endpoint, table, field types
 *   - zapdev/client  : useQuery, useMutation, useAuth, router, auth UI
 *   - zapdev/shared  : types and pure helpers reusable on both sides
 *
 * Re-exports below let users import everything from `zapdev` if they want,
 * but the per-side entrypoints are the recommended contract.
 */

export * from "./server/index.js";
export * from "./client/index.js";
export type * from "./shared/index.js";
