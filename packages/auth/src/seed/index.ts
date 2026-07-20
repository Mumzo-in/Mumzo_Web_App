import { seedAdminUser } from "./admin-user";
import { seedRoles } from "./roles";

/**
 * Seed runner — `bun seed`.
 *
 * Order matters: roles first, because the admin account is created with
 * `role: "superadmin"` and that key must resolve to a real row before any
 * permission check can pass.
 *
 * Everything here is idempotent, so running it against a database that is
 * already seeded is a no-op rather than an error. Adding a new seeder means
 * adding a file beside this one and a line below — nothing else.
 *
 *   bun seed
 *   bun seed --email you@mumzo.in --password 'a-longer-password'
 */

export { seedAdminUser } from "./admin-user";
export { seedRoles } from "./roles";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

export async function runSeed(
  options: { email?: string; password?: string; name?: string } = {},
) {
  const roles = await seedRoles();

  console.info(
    roles.created > 0
      ? `Roles:  ${roles.created} created, ${roles.skipped} already present.`
      : `Roles:  all ${roles.skipped} already present.`,
  );

  const admin = await seedAdminUser(options);

  if (!admin.created) {
    console.info(`Admin:  ${admin.email} already exists — left untouched.`);
    return;
  }

  console.info(`Admin:  created ${admin.email}`);

  if (admin.password) {
    console.info("");
    console.info(`  Password: ${admin.password}`);
    console.info("  This is the default — change it after first sign-in.");
  }
}

if (import.meta.main) {
  runSeed({
    email: readArg("--email"),
    password: readArg("--password"),
    name: readArg("--name"),
  })
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
