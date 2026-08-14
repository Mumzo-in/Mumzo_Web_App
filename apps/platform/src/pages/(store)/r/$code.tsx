import { Button } from "@mumzo/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { sessionQueryOptions } from "@/modules/auth";
import { trackReferralClick } from "@/modules/referrals/api/referrals-api";
import {
  buildInviteMessage,
  referralOgImage,
  shareOnWhatsApp,
} from "@/modules/referrals/lib/share-invite";

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.892.531 3.66 1.451 5.169L2 22l4.964-1.428A9.943 9.943 0 0 0 12.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.181a8.14 8.14 0 0 1-4.427-1.302l-.318-.19-3.115.897.906-3.037-.207-.312a8.128 8.128 0 0 1-1.283-4.418c0-4.507 3.667-8.174 8.176-8.174 4.508 0 8.174 3.667 8.174 8.174 0 4.509-3.666 8.362-8.406 8.362z" />
    </svg>
  );
}

export const Route = createFileRoute("/(store)/r/$code")({
  component: ReferralLandingPage,
  head: ({ params }) => ({
    meta: [
      { property: "og:image", content: referralOgImage(params.code) },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ReferralLandingPage() {
  const { code } = Route.useParams();
  const { data: session } = useQuery(sessionQueryOptions);

  // `trackReferralClick` both validates the code and records the
  // `link_shared` referral row. TanStack Query caches by key and never
  // re-fires a resolved query, so this lands once per landing (not once per
  // render) without any manual guard — a refetch would only happen if the
  // user navigates away and back to a fresh `code` param.
  const { data, isPending } = useQuery({
    queryKey: ["referrals", "track-click", code],
    queryFn: () => trackReferralClick(code),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const isAuthed = Boolean(session);
  const loginHref = `/auth/login?ref=${encodeURIComponent(code)}`;

  return (
    <div className="mx-auto mt-16 w-full max-w-md px-4 pb-10">
      <div className="rounded-3xl bg-card p-8 shadow-warm">
        {isPending ? (
          <p className="text-center text-muted-foreground text-sm">
            Checking your invite…
          </p>
        ) : !data?.valid ? (
          <>
            <h1 className="text-center font-editorial text-3xl text-ink tracking-tight">
              This invite link isn't valid
            </h1>
            <p className="mt-3 text-center text-foreground/60 text-sm leading-relaxed">
              The referral code in this link doesn't exist or is no longer
              active. You can still explore Mumzo and shop as normal.
            </p>
            <Button
              render={<Link to="/" />}
              className="mt-6 h-11 w-full rounded-full bg-primary font-semibold text-base text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to Mumzo
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-center font-editorial text-3xl text-ink tracking-tight">
              {data.isSelf
                ? "That's your own invite link"
                : "You've been invited!"}
            </h1>
            {!data.isSelf && (
              <p className="mt-2 text-center font-accent text-lg text-primary">
                by {data.referrerName}
              </p>
            )}

            <div className="mt-6 rounded-2xl bg-accent/30 p-4 text-center">
              <p className="text-foreground/70 text-sm">
                {data.isSelf
                  ? "Friends who sign up with this link get"
                  : "Sign up and place your first order to get"}
              </p>
              <p className="mt-1 font-editorial text-4xl text-ink">
                ₹{data.refereeReward} off
              </p>
            </div>

            {data.isSelf ? (
              <>
                <p className="mt-6 text-center text-foreground/60 text-sm leading-relaxed">
                  This is your own referral link — you can't use your own
                  coupon. Share it with a friend instead to earn your reward.
                </p>
                <Button
                  className="mt-4 h-11 w-full rounded-full bg-sage font-semibold text-base text-ink transition-colors hover:bg-sage/80"
                  data-testid="referral-landing-share-whatsapp"
                  onClick={() =>
                    shareOnWhatsApp(
                      buildInviteMessage(
                        undefined,
                        data.code,
                        data.refereeReward,
                      ),
                    )
                  }
                >
                  <WhatsAppIcon />
                  Share on WhatsApp
                </Button>
              </>
            ) : isAuthed ? (
              <p className="mt-6 text-center text-foreground/60 text-sm leading-relaxed">
                You're already signed in — referral codes can only be used once,
                at signup.
              </p>
            ) : (
              <>
                <Button
                  render={<Link to={loginHref} />}
                  data-testid="referral-landing-signup"
                  className="mt-6 h-11 w-full rounded-full bg-primary font-semibold text-base text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Sign up with this code
                </Button>
                {/* <p className="mt-4 text-center text-muted-foreground text-sm">
                  Already have an account?{" "}
                  <Link to="/auth/login" className="font-semibold text-primary">
                    Sign in
                  </Link>
                </p> */}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
