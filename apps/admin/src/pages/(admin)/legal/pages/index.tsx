import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { LegalPageList } from "@/modules/cms";

export const Route = createFileRoute("/(admin)/legal/pages/")({
  component: LegalPagesPage,
});

function LegalPagesPage() {
  return (
    <>
      <PageHeader
        title="Legal & static pages"
        description="Content behind the storefront's policy routes."
      />
      <LegalPageList />
    </>
  );
}
