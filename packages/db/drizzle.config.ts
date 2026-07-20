import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: "../../apps/server/.env",
});

const databaseUrl = process.env.DATABASE_URL;

// Fail loudly. Falling back to "" here surfaces as an opaque driver error at
// connect time instead of naming the actual problem.
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy apps/server/.env.example to " +
      "apps/server/.env, then run `bun db:start`.",
  );
}

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  // Surfaces the SQL drizzle-kit is about to run before it runs it.
  verbose: true,
  // Prompts before anything destructive — the guard against a generate/push
  // silently dropping a column.
  strict: true,
});
