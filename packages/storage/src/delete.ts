import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { env } from "@mumzo/env/server";

import { r2 } from "./client";
import type { StorageBucket } from "./types";

function bucketName(bucket: StorageBucket): string {
  return bucket === "public" ? env.R2_PUBLIC_BUCKET : env.R2_PRIVATE_BUCKET;
}

export async function deleteObject(
  bucket: StorageBucket,
  key: string,
): Promise<void> {
  await r2().send(
    new DeleteObjectCommand({ Bucket: bucketName(bucket), Key: key }),
  );
}

/** No-ops on an empty list — R2 rejects a `DeleteObjects` call with 0 keys. */
export async function deleteObjects(
  bucket: StorageBucket,
  keys: string[],
): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  await r2().send(
    new DeleteObjectsCommand({
      Bucket: bucketName(bucket),
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }),
  );
}
