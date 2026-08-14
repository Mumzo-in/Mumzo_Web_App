import { env } from "@mumzo/env/server";
import { Hono } from "hono";

import { validateCode } from "./referrals.service";

/**
 * Server-rendered HTML for `GET /r/:code` — the storefront is a plain SPA
 * (no SSR/prerendering), so link-preview crawlers (WhatsApp, iMessage,
 * Facebook, Twitter/X, Slack) never run its JS and never see the `og:*`
 * meta tags `head()` injects client-side. This route exists purely to give
 * those crawlers real HTML with real OG tags; a human visitor is bounced to
 * the actual SPA route instantly via a meta-refresh + JS redirect (both, so
 * it works with JS disabled too).
 */

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function sharePageHtml(options: {
  title: string;
  description: string;
  image: string;
  redirectTo: string;
}) {
  const title = escapeHtml(options.title);
  const description = escapeHtml(options.description);
  const image = escapeHtml(options.image);
  const redirectTo = escapeHtml(options.redirectTo);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
<meta http-equiv="refresh" content="0; url=${redirectTo}" />
<script>window.location.replace(${JSON.stringify(options.redirectTo)});</script>
</head>
<body>
<p>Redirecting to <a href="${redirectTo}">Mumzo</a>…</p>
</body>
</html>`;
}

const app = new Hono();

app.get("/:code", async (c) => {
  const code = c.req.param("code");
  const redirectTo = `${env.PLATFORM_URL}/r/${encodeURIComponent(code)}`;
  // The PNG renderer lives on this same server (og.module.ts) — build the
  // image URL off the incoming request's own origin rather than assuming
  // PLATFORM_URL proxies /api, since it may not in every deployment.
  const serverOrigin = new URL(c.req.url).origin;

  try {
    const { referrerName, refereeReward } = await validateCode(code);
    const html = sharePageHtml({
      title: `${referrerName} invited you to Mumzo`,
      description: `Mumzo delivers baby & mom essentials in 10 minutes. Sign up with code ${code} and get ₹${refereeReward} off your first order.`,
      image: `${serverOrigin}/api/v1/og/referral/${code}`,
      redirectTo,
    });
    return c.html(html);
  } catch {
    // Invalid/expired code — still bounce to the SPA, which has its own
    // "invalid invite" fallback state; just skip the personalized OG tags.
    const html = sharePageHtml({
      title: "You're invited to Mumzo",
      description:
        "Mumzo delivers baby & mom essentials in 10 minutes — the stuff you need, right when you need it.",
      image: `${serverOrigin}/api/v1/og/default`,
      redirectTo,
    });
    return c.html(html);
  }
});

export default app;
