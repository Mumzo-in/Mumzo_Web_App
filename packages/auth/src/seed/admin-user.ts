import { db } from "@mumzo/db";
import { staffUser } from "@mumzo/db/schema/staff";
import { eq } from "drizzle-orm";

import { adminAuth } from "../admin";

/**
 * Creates the first superadmin.
 *
 * Staff sign-up is disabled over HTTP (`disableSignUp: true`), so there is no
 * way to make the first account through the API — this is the bootstrap.
 * Every later account is created from inside the panel.
 *
 * Goes through Better Auth's API rather than inserting a row: the password
 * must be hashed with the algorithm sign-in verifies against, and a
 * hand-written INSERT produces an account that can never log in.
 */

export const DEFAULT_ADMIN_EMAIL = "admin@mumzo.in";

/** Must clear `minPasswordLength: 12` on the admin instance. */
export const DEFAULT_ADMIN_PASSWORD = "password1234";

const MIN_PASSWORD_LENGTH = 12;

export type AdminSeedOptions = {
  email?: string;
  password?: string;
  name?: string;
};

export async function seedAdminUser(options: AdminSeedOptions = {}) {
  const email = options.email ?? DEFAULT_ADMIN_EMAIL;
  const password = options.password ?? DEFAULT_ADMIN_PASSWORD;
  const name = options.name ?? "Super Admin";

  // Checked here so the failure names the problem, rather than surfacing as
  // an opaque Better Auth error.
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  const [existing] = await db
    .select({ id: staffUser.id })
    .from(staffUser)
    .where(eq(staffUser.email, email))
    .limit(1);

  if (existing) {
    return { created: false, email, password: null };
  }

  await adminAuth.api.createUser({
    body: { email, password, name, role: "superadmin" },
  });

  return {
    created: true,
    email,
    // Only surfaced when it is the default — a supplied password is the
    // caller's to know, and echoing it into logs is worse than useless.
    password: options.password ? null : password,
  };
}
