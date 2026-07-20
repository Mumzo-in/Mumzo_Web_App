import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { StaffTable } from "@/modules/staff";

export const Route = createFileRoute("/(admin)/staff/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Staff & roles"
        description="Admin accounts and permissions."
      />
      <div className="flex flex-col gap-6" data-testid="admin-staff-page">
        <StaffTable />
      </div>
    </>
  );
}
