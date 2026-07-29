/** Customer records — api-plan §15e. */

export type UserStatus = "active" | "banned";

export type BabyProfile = {
  name: string;
  /** ISO date; age drives storefront recommendations. */
  dob: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  orderCount: number;
  lifetimeValue: number;
  babies: BabyProfile[];
  joinedAt: string;
  lastOrderAt: string | null;
};

export const USER_STATUS_META: Record<
  UserStatus,
  { label: string; tint: string }
> = {
  active: { label: "Active", tint: "bg-sage text-ink" },
  banned: { label: "Banned", tint: "bg-destructive/10 text-destructive" },
};

/**
 * Named sort presets for the users table, synced to the `sort` URL param.
 * `mostValued` is listed but disabled in the UI — no `order` table exists
 * yet, so `orderCount`/`lifetimeValue` are always 0 and sorting by them
 * would be meaningless. It activates once real order data lands.
 */
export const USER_SORT_PRESETS = {
  recent: { label: "Recent", sortBy: "joinedAt", sortDir: "desc" },
  oldest: { label: "Oldest", sortBy: "joinedAt", sortDir: "asc" },
  nameAsc: { label: "Name (A–Z)", sortBy: "name", sortDir: "asc" },
  nameDesc: { label: "Name (Z–A)", sortBy: "name", sortDir: "desc" },
  mostValued: {
    label: "Most valued",
    sortBy: "lifetimeValue",
    sortDir: "desc",
  },
} as const satisfies Record<
  string,
  { label: string; sortBy: string; sortDir: "asc" | "desc" }
>;

/**
 * The literal tuple, not `Object.keys()` — `z.enum()` needs a statically
 * known non-empty tuple to infer a literal union; `Object.keys()` only ever
 * types as `string[]`, which would widen `search.sort` back to `string`.
 */
export const USER_SORT_PRESET_KEYS = [
  "recent",
  "oldest",
  "nameAsc",
  "nameDesc",
  "mostValued",
] as const;

export type UserSortPreset = (typeof USER_SORT_PRESET_KEYS)[number];

export const DEFAULT_USER_SORT: UserSortPreset = "recent";

/** Presets the server can actually honor today — excludes `mostValued`. */
export const ACTIVE_USER_SORT_PRESETS: readonly UserSortPreset[] = [
  "recent",
  "oldest",
  "nameAsc",
  "nameDesc",
];

/** Baby age in months — the storefront's key recommendation signal. */
export function ageInMonths(dob: string, now = new Date()): number {
  const born = new Date(dob);
  return Math.max(
    0,
    (now.getFullYear() - born.getFullYear()) * 12 +
      (now.getMonth() - born.getMonth()),
  );
}

/**
 * The temp email Better Auth derives from a phone number (`getTempEmail` in
 * `packages/auth/src/platform.ts`) — not a real address, so it's hidden
 * rather than shown as if the customer supplied it.
 */
export function isPlaceholderEmail(email: string): boolean {
  return email.endsWith("@phone.mumzo.local");
}
