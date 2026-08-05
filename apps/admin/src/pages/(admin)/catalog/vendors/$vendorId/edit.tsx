import { Button } from "@mumzo/ui/components/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  getVendor,
  updateVendor,
  VendorForm,
  type VendorFormHandle,
  type VendorInput,
} from "@/modules/vendor";

export const Route = createFileRoute("/(admin)/catalog/vendors/$vendorId/edit")(
  {
    component: EditVendorPage,
  },
);

function EditVendorPage() {
  const { vendorId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<VendorFormHandle>(null);
  const [pending, setPending] = useState(false);

  const { data: vendor, isLoading } = useQuery({
    queryKey: queryKeys.vendors.detail(vendorId),
    queryFn: () => getVendor(vendorId),
  });

  if (isLoading || !vendor) {
    return <Loader />;
  }

  async function handleUpdate(values: VendorInput) {
    const updated = await updateVendor(vendorId, values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    toast.success(`Saved “${updated.name}”.`);
    navigate({
      to: "/catalog/vendors/$vendorId",
      params: { vendorId },
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
            {pending ? "Saving…" : "Save changes"}
          </Button>
        }
        description={vendor.slug}
        title={`Edit ${vendor.name}`}
      />
      <VendorForm
        onPendingChange={setPending}
        onSubmit={handleUpdate}
        ref={formRef}
        vendor={vendor}
      />
    </>
  );
}
