import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@mumzo/env/server";

/**
 * Lazy R2 client singleton. R2 speaks the S3 API — `@aws-sdk/client-s3`
 * works unmodified against it, pointed at the account's R2 endpoint with
 * region "auto".
 *
 * Lazy so importing this module never touches `env` (and therefore never
 * throws on missing R2 credentials) until an operation actually needs the
 * client — required env vars are only exercised by upload/copy/delete calls.
 */
let client: S3Client | undefined;

export function r2(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}
