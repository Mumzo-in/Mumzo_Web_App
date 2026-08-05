import { Button } from "@mumzo/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  createVendor,
  VendorForm,
  type VendorFormHandle,
  type VendorInput,
} from "@/modules/vendor";

export const Route = createFileRoute("/(admin)/catalog/vendors/new")({
  component: NewVendorPage,
});

function NewVendorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<VendorFormHandle>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(values: VendorInput) {
    const created = await createVendor(values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    toast.success(`Created “${created.name}”.`);
    navigate({
      to: "/catalog/vendors/$vendorId",
      params: { vendorId: created.id },
    });
  }

  return (
    <>
      <PageHeader
        actions={
          <Button
            data-testid="admin-vendor-submit-header"
            disabled={pending}
            onClick={() => formRef.current?.submit()}
            type="button"
          >
            {pending ? "Creating…" : "Create vendor"}
          </Button>
        }
        description="Vendors are the suppliers products are sourced from."
        title="New vendor"
      />
      <VendorForm
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
      />
    </>
  );
}
