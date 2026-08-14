import { BASE_URL } from "@/core/api/client";

/** Server-rendered share card for a referral link's meta tags — the mom +
 * baby brand photo with the referrer's name and reward baked in, so a
 * shared `/r/:code` link previews as a real card instead of the site-wide
 * default banner. See `apps/server/.../platform/v1/og/og.module.ts`. */
export const referralOgImage = (code: string): string =>
  `${BASE_URL}/og/referral/${code}`;

/** Builds the referral invite message shared from the hero and the
 * `/r/$code` landing page — kept in one place so the copy can't drift. */
export function buildInviteMessage(
  referrerName: string | undefined,
  code: string,
  refereeReward: number,
) {
  const link = `${window.location.origin}/r/${code}`;
  const opener = referrerName
    ? `${referrerName} invited you to Mumzo`
    : "You've been invited to Mumzo";

  return [
    `${opener} 👶💛`,
    "",
    "Mumzo delivers baby & mom essentials in 10 minutes — the stuff you need, right when you need it.",
    "",
    `Sign up with my code ${code} and get ₹${refereeReward} off your first order:`,
    link,
  ].join("\n");
}

/** Native share sheet when available, WhatsApp link otherwise. */
export async function shareInvite(text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
    } catch {
      // user dismissed the native share sheet
    }
    return;
  }

  shareOnWhatsApp(text);
}

/** Always opens WhatsApp directly, skipping the native share sheet. */
export function shareOnWhatsApp(text: string) {
  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer",
  );
}
