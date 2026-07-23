import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { env } from "@mumzo/env/server";

import { r2 } from "./client";
import type { StorageBucket } from "./types";

function bucketName(bucket: StorageBucket): string {
  return bucket === "public" ? env.R2_PUBLIC_BUCKET : env.R2_PRIVATE_BUCKET;
}

/** Lists every object key under a prefix — used to sweep `tmp/{sessionId}/*`. */
export async function listKeys(
  bucket: StorageBucket,
  prefix: string,
): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const result = await r2().send(
      new ListObjectsV2Command({
        Bucket: bucketName(bucket),
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of result.Contents ?? []) {
      if (object.Key) {
        keys.push(object.Key);
      }
    }

    continuationToken = result.IsTruncated
      ? result.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return keys;
}
