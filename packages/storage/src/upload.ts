import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@mumzo/env/server";

import { r2 } from "./client";
import type { StorageBucket } from "./types";

function bucketName(bucket: StorageBucket): string {
  return bucket === "public" ? env.R2_PUBLIC_BUCKET : env.R2_PRIVATE_BUCKET;
}

/** Uploads a buffer to R2, returning the object's ETag. */
export async function putObject(
  bucket: StorageBucket,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const result = await r2().send(
    new PutObjectCommand({
      Bucket: bucketName(bucket),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return result.ETag ?? "";
}
