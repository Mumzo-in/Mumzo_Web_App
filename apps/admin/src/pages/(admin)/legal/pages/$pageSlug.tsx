import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/legal/pages/$pageSlug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { pageSlug } = Route.useParams();
  return (
    <>
      <PageHeader title="Edit page" description={pageSlug} />
      <ComingSoon
        title="Legal page editing"
        description="No CMS endpoint is specced yet — features.md §13 marks this P1/P0."
        phase={1}
        needsApiSpec
      />
    </>
  );
}
