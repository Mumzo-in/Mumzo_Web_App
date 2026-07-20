import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { config } from "dotenv";

/**
 * Loads the repo-root `.env`, wherever the process happens to start from.
 *
 * `import "dotenv/config"` resolves against `process.cwd()`, so it only works
 * when a command runs from the directory holding the file. Scripts run from a
 * workspace (`bun run -F @mumzo/auth seed:admin`, drizzle-kit inside
 * `packages/db`) start elsewhere and silently load nothing — which surfaces
 * later as an opaque "Invalid environment variables".
 *
 * Walking up to the marker makes the location independent of the caller.
 */

/** The root is the only directory with both a lockfile and a workspace list. */
function findRepoRoot(startDir: string): string | null {
  let current = resolve(startDir);

  while (true) {
    if (
      existsSync(join(current, "bun.lock")) ||
      existsSync(join(current, "turbo.json"))
    ) {
      return current;
    }

    const parent = dirname(current);

    // Reached the filesystem root without finding a marker.
    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

export function loadRootEnv() {
  // Vite injects env itself and has no `process.cwd()` worth walking; browser
  // bundles must never try to read the filesystem.
  if (typeof process === "undefined" || !process.versions?.node) {
    return;
  }

  const root = findRepoRoot(process.cwd());

  if (!root) {
    return;
  }

  // `override: false` — a real environment variable (CI secret, container env)
  // always beats the file. The file is a local-development convenience, not a
  // source of truth in deployed environments.
  config({ path: join(root, ".env"), quiet: true, override: false });
}
