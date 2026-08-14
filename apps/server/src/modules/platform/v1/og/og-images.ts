import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const IMAGES_DIR = fileURLToPath(
  new URL("../../../../assets/images", import.meta.url),
);

let cachedReferralHero: string | null = null;

/** The mom + baby brand photo used on the referral share card — loaded once
 * per process and returned as a data URI, since satori's `img.src` needs a
 * directly resolvable source, not a relative path into this app's own
 * filesystem. */
export async function loadReferralHeroImage(): Promise<string> {
  if (cachedReferralHero) return cachedReferralHero;

  const buffer = await readFile(`${IMAGES_DIR}/referral-hero.png`);
  cachedReferralHero = `data:image/png;base64,${buffer.toString("base64")}`;
  return cachedReferralHero;
}
