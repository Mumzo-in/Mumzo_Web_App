import { Button } from "@mumzo/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";

import { sessionQueryOptions } from "@/modules/auth/queries/session";
import { trackReferralClick } from "@/modules/referrals/api/referrals-api";
import { referralOgImage } from "@/modules/referrals/lib/share-invite";

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
  const { data, isPending, isError } = useQuery({
    queryKey: ["referrals", "track-click", code],
    queryFn: () => trackReferralClick(code),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const isAuthed = Boolean(session);

  return (
    <div className="mx-auto mt-16 w-full max-w-md px-4 pb-10">
      <div className="rounded-3xl bg-card p-8 shadow-warm">
        {isPending ? (
          <p className="text-center text-muted-foreground text-sm">
            Checking your invite…
          </p>
        ) : isError || !data ? (
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
        ) : data.isSelf ? (
          <>
            <h1 className="text-center font-editorial text-3xl text-ink tracking-tight">
              That's your own invite link
            </h1>
            <p className="mt-3 text-center text-foreground/60 text-sm leading-relaxed">
              Share it with a friend instead — you can't use your own referral
              code.
            </p>
            <Button
              render={<Link to="/referrals" />}
              className="mt-6 h-11 w-full rounded-full bg-primary font-semibold text-base text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to your referrals
            </Button>
          </>
        ) : isAuthed ? (
          <>
            <h1 className="text-center font-editorial text-3xl text-ink tracking-tight">
              You're already signed in
            </h1>
            <p className="mt-3 text-center text-foreground/60 text-sm leading-relaxed">
              Referral codes can only be applied once, at signup — this link
              doesn't apply to your account.
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
              You've been invited!
            </h1>
            <p className="mt-2 text-center font-accent text-lg text-primary">
              by {data.referrerName}
            </p>

            <div className="mt-6 rounded-2xl bg-accent/30 p-4 text-center">
              <p className="text-foreground/70 text-sm">
                Sign up and place your first order to get
              </p>
              <p className="mt-1 font-editorial text-4xl text-ink">
                ₹{data.refereeReward} off
              </p>
              <p
                className="mt-2 font-semibold text-foreground/50 text-xs tracking-wide"
                data-testid="referral-landing-code"
              >
                Code {data.code}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                render={
                  <Link
                    to="/register"
                    search={{ ref: code }}
                    data-testid="referral-landing-signup"
                  />
                }
                className="h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
              >
                <UserPlus size={15} className="mr-1.5" />
                Sign up with this code
              </Button>
              <Button
                variant="outline"
                render={
                  <Link
                    to="/auth/login"
                    search={{ ref: code }}
                    data-testid="referral-landing-login"
                  />
                }
                className="h-11 w-full cursor-pointer rounded-full border-ink/20 font-semibold text-ink hover:bg-secondary"
              >
                <LogIn size={15} className="mr-1.5" />I already have an account
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
