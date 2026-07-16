import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/finance/tax")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Tax & invoicing"
        description="GST configuration and invoice numbering."
      />
      <ComingSoon
        title="Tax & invoicing"
        description="GST configuration and invoice numbering."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
