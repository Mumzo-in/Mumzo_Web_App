import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";

import { sessionQueryOptions } from "@/modules/auth";
import { getPendingReview } from "../api/reviews-api";

const ReviewPromptModal = lazy(() => import("./review-prompt-modal"));

/**
 * Mounts the review-prompt popup whenever the signed-in user has a
 * delivered order still owed a rating — one at a time, oldest first. Safe
 * to mount on multiple pages (home, orders) since it's a no-op query when
 * there's nothing pending.
 */
export default function ReviewPromptHost() {
  const { data: session } = useQuery(sessionQueryOptions);
  const queryClient = useQueryClient();
  const [dismissedOrderId, setDismissedOrderId] = useState<string | null>(null);

  const { data: pending } = useQuery({
    queryKey: ["reviews", "pending"],
    queryFn: getPendingReview,
    enabled: Boolean(session),
    staleTime: 60_000,
    // Polls so a newly-notified review (the server-side sweep, currently
    // every 1 minute) surfaces without the user having to reload — matches
    // the sweep's cadence rather than guessing at a shorter/longer value.
    refetchInterval: 60_000,
  });

  if (!pending || pending.orderId === dismissedOrderId) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ReviewPromptModal
        onDone={() => {
          setDismissedOrderId(pending.orderId);
          queryClient.invalidateQueries({ queryKey: ["reviews", "pending"] });
        }}
        orderId={pending.orderId}
      />
    </Suspense>
  );
}
