import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@mumzo/env/server";

import { r2 } from "./client";
import type { StorageBucket } from "./types";

function bucketName(bucket: StorageBucket): string {
  return bucket === "public" ? env.R2_PUBLIC_BUCKET : env.R2_PRIVATE_BUCKET;
}

/** Copies an object within the same bucket — used to promote `tmp/` drafts. */
export async function copyObject(
  bucket: StorageBucket,
  srcKey: string,
  destKey: string,
): Promise<void> {
  const Bucket = bucketName(bucket);
  await r2().send(
    new CopyObjectCommand({
      Bucket,
      CopySource: `${Bucket}/${srcKey}`,
      Key: destKey,
    }),
  );
}
