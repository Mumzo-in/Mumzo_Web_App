import { env } from "@mumzo/env/server";
import sharp from "sharp";

import type { ProcessedImage } from "./types";

/**
 * Normalizes any uploaded image to WebP: respects EXIF orientation, caps the
 * long edge at `maxDimension` (never enlarges smaller images), and encodes
 * at `quality`. This is the single place format/size enforcement happens —
 * every stored image, regardless of what the client uploaded, comes out of
 * here.
 */
export async function processImage(
  buffer: Buffer,
  opts?: { maxDimension?: number; quality?: number },
): Promise<ProcessedImage> {
  const maxDimension = opts?.maxDimension ?? env.R2_IMAGE_MAX_DIMENSION;
  const quality = opts?.quality ?? env.R2_IMAGE_QUALITY;

  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    contentType: "image/webp",
    width: info.width,
    height: info.height,
    sizeBytes: info.size,
  };
}
