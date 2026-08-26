import { createFileRoute } from "@tanstack/react-router";
import { DeliveryView } from "@/modules/delivery";

/** `/delivery?token=…` — the shareable rider link. The token identifies the
 * order, and stays in search params rather than the path to keep the route
 * flat until the dedicated server endpoint lands. An absent token resolves to
 * an empty string, which the view renders as an invalid link. */
type DeliverySearch = {
  token: string;
};

export const Route = createFileRoute("/(public)/delivery/")({
  component: DeliveryPage,
  validateSearch: (search: Record<string, unknown>): DeliverySearch => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
});

function DeliveryPage() {
  const { token } = Route.useSearch();
  return <DeliveryView token={token} />;
}
