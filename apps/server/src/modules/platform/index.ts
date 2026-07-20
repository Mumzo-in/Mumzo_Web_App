/**
 * Platform module — everything the customer storefront talks to.
 *
 * Versions live in their own folders (`./v1`, later `./v2`) and the URL
 * prefix is applied by `router.ts`. Keeping the version as a folder rather
 * than a path string means a v2 can share `shared/` domain logic with v1
 * while changing only its request/response shaping.
 */

export { default as v1 } from "./v1";
