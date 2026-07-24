import { randomUUID } from "node:crypto";

import { platformAuth } from "@mumzo/auth";
import { db } from "@mumzo/db";
import { baby } from "@mumzo/db/schema/account";
import { user } from "@mumzo/db/schema/auth";
import { eq } from "drizzle-orm";

import { badRequest } from "@/core/errors";

type OnboardingInput = {
  name: string;
  email?: string;
  babies?: {
    name: string;
    dob: string;
    gender?: "girl" | "boy" | "other";
  }[];
};

/**
 * Writes the "complete your profile" onboarding submission for `userId`.
 *
 * Name/email go through Better Auth's own `updateUser` API rather than a
 * raw Drizzle update — that's the standard Better Auth field surface, and
 * routing through it keeps any hooks/validation the adapter runs on user
 * updates intact instead of bypassing them. `onboardedAt` is a custom
 * `additionalFields` entry (see `packages/auth/src/platform.ts`), also
 * updatable through the same call. The optional baby row is a plain insert
 * into our own table — Better Auth has no concept of it.
 */
export async function completeOnboarding(
  userId: string,
  headers: Headers,
  input: OnboardingInput,
) {
  const now = /* @__PURE__ */ new Date();

  const result = await platformAuth.api.updateUser({
    headers,
    body: {
      name: input.name,
      ...(input.email ? { email: input.email } : {}),
    },
  });

  if (!result?.status) {
    throw badRequest("Could not update your profile. Try again.");
  }

  // `onboardedAt` is deliberately `input: false` on the Better Auth
  // additionalField (see `packages/auth/src/platform.ts`) — it's a
  // server-decided timestamp, not client-settable via `updateUser`, so it's
  // written directly here instead.
  await db.update(user).set({ onboardedAt: now }).where(eq(user.id, userId));

  if (input.babies && input.babies.length > 0) {
    await db.insert(baby).values(
      input.babies.map((entry) => ({
        id: randomUUID(),
        userId,
        name: entry.name,
        dob: entry.dob,
        gender: entry.gender ?? null,
      })),
    );
  }

  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      onboardedAt: user.onboardedAt,
    })
    .from(user)
    .where(eq(user.id, userId));

  if (!row?.onboardedAt) {
    throw badRequest("Could not update your profile. Try again.");
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    onboardedAt: row.onboardedAt.toISOString(),
  };
}
