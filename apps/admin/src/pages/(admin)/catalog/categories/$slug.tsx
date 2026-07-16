import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/categories/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return (
    <>
      <PageHeader title="Edit category" description={slug} />
      <ComingSoon
        title="Category editing"
        description="Needs PATCH /admin/categories/:slug."
        phase={1}
      />
    </>
  );
}
