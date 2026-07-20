/**
 * Shared types, one file per concern.
 *
 *   app-env.ts   Hono context (AppEnv, SessionUser)
 *   response.ts  Envelope shapes (SuccessResponse, PaginatedResponse, …)
 *
 * Types only — no runtime values, so importing from here costs nothing at
 * build time.
 */

export type * from "./app-env";
export type * from "./response";
