import { Button } from "@mumzo/ui/components/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  BundleForm,
  type BundleFormHandle,
  type BundleInput,
  getBundle,
  updateBundle,
} from "@/modules/bundle";

export const Route = createFileRoute("/(admin)/catalog/bundles/$bundleId/edit")(
  {
    component: EditBundlePage,
  },
);

function EditBundlePage() {
  const { bundleId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<BundleFormHandle>(null);
  const [pending, setPending] = useState(false);

  const { data: bundle, isLoading } = useQuery({
    queryKey: queryKeys.bundles.detail(bundleId),
    queryFn: () => getBundle(bundleId),
  });

  if (isLoading || !bundle) {
    return <Loader />;
  }

  async function handleUpdate(values: BundleInput) {
    const updated = await updateBundle(bundleId, values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.bundles.all });
    toast.success(`Saved “${updated.name}”.`);
    navigate({
      to: "/catalog/bundles/$bundleId",
      params: { bundleId },
    });
  }

  return (
    <>
      <PageHeader
        actions={
          <Button
            data-testid="admin-bundle-submit-header"
            disabled={pending}
            onClick={() => formRef.current?.submit()}
            type="button"
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>
        }
        description={bundle.slug}
        title={`Edit ${bundle.name}`}
      />
      <BundleForm
        bundle={bundle}
        onPendingChange={setPending}
        onSubmit={handleUpdate}
        ref={formRef}
      />
    </>
  );
}
