import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@mumzo/env/server";

import { r2 } from "./client";
import type { StorageBucket } from "./types";

function bucketName(bucket: StorageBucket): string {
  return bucket === "public" ? env.R2_PUBLIC_BUCKET : env.R2_PRIVATE_BUCKET;
}

/** Downloads an object from R2 as a Buffer — used where a file needs to be
 * read back and processed server-side (e.g. parsing an uploaded import
 * sheet), not just served by public URL. */
export async function getObject(
  bucket: StorageBucket,
  key: string,
): Promise<Buffer> {
  const result = await r2().send(
    new GetObjectCommand({ Bucket: bucketName(bucket), Key: key }),
  );
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error(`Object ${key} has no body.`);
  }
  return Buffer.from(bytes);
}
