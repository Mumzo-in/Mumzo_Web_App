/**
 * Seeds the first superadmin account.
 *
 * Staff sign-up is disabled over HTTP (`disableSignUp: true`), so there is no
 * way to create the first account through the API — this script is the
 * bootstrap. Every later account is created from inside the panel by a
 * superadmin.
 *
 *   bun seed:admin
 *   bun seed:admin --email you@mumzo.in --password 'a-long-password'
 *
 * Lives in `packages/auth` rather than `packages/db` because it needs both,
 * and `auth` already depends on `db` — the other direction would be a cycle.
 *
 * Goes through Better Auth's API rather than inserting rows directly: the
 * password must be hashed with the same algorithm sign-in verifies against,
 * and a hand-written INSERT would produce an account that can never log in.
 *
 * Safe to re-run — an existing email is reported and left untouched.
 */

import { db } from "@mumzo/db";
import { staffUser } from "@mumzo/db/schema/staff";
import { eq } from "drizzle-orm";

import { adminAuth } from "./admin";

const DEFAULT_EMAIL = "admin@mumzo.in";
/**
 * Must clear `minPasswordLength: 12` on the admin instance — a shorter
 * default (e.g. plain "password") makes the seed fail at `createUser`.
 * Local-only convenience; pass `--password` for anything deployed.
 */
const DEFAULT_PASSWORD = "password1234";
const MIN_PASSWORD_LENGTH = 12;

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function seedAdmin() {
  const email = readArg("--email") ?? DEFAULT_EMAIL;
  const password = readArg("--password") ?? DEFAULT_PASSWORD;
  const name = readArg("--name") ?? "Super Admin";

  // Matches `minPasswordLength` on the admin instance. Checked here so the
  // failure names the problem instead of surfacing as a Better Auth error.
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  const existing = await db
    .select({ id: staffUser.id, role: staffUser.role })
    .from(staffUser)
    .where(eq(staffUser.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.info(`Staff account already exists: ${email}`);
    console.info("Nothing to do. Delete the row first to re-seed.");
    return;
  }

  await adminAuth.api.createUser({
    body: {
      email,
      password,
      name,
      role: "superadmin",
    },
  });

  console.info("Created superadmin account:");
  console.info(`  email    ${email}`);

  if (!readArg("--password")) {
    console.info(`  password ${password}`);
    console.info("");
    console.info("This is the default password — change it after first login.");
  }
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  });
