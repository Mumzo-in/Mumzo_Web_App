import { env } from "@mumzo/env/server";

/**
 * Builds the public CDN URL for a key. Resize params (`?w=&q=`) are only
 * appended when both a resize is requested and the Cloudflare Image
 * Resizing worker is enabled — otherwise the original WebP is served as-is.
 */
export function toPublicUrl(
  key: string,
  resize?: { w: number; q?: number },
): string {
  const base = `${env.R2_PUBLIC_URL}/${key}`;

  if (!resize || !env.R2_ENABLE_CDN_RESIZE) {
    return base;
  }

  const params = new URLSearchParams({ w: String(resize.w) });
  if (resize.q) {
    params.set("q", String(resize.q));
  }

  return `${base}?${params}`;
}
