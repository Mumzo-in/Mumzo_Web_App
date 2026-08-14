import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const IMAGES_DIR = fileURLToPath(
  new URL("../../../../assets/images", import.meta.url),
);

let cachedReferralOgCard: Buffer | null = null;

/** The finished, pre-designed 1200x630 referral share card — served as-is
 * for `/og/referral/:code` rather than composited via satori, since it's
 * already a complete card (branding, headline, CTA), not a raw photo that
 * needs per-referrer text overlaid on it. Loaded once per process. */
export async function loadReferralOgCard(): Promise<Buffer> {
  if (cachedReferralOgCard) return cachedReferralOgCard;

  cachedReferralOgCard = await readFile(`${IMAGES_DIR}/og-refer-image.png`);
  return cachedReferralOgCard;
}
