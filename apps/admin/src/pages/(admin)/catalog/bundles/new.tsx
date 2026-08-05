import { Button } from "@mumzo/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  BundleForm,
  type BundleFormHandle,
  type BundleInput,
  createBundle,
} from "@/modules/bundle";

const searchSchema = z.object({
  /** Prefills one item — set by the product form's "create a bundle with
   * this product" shortcut. */
  productId: z.string().optional(),
});

export const Route = createFileRoute("/(admin)/catalog/bundles/new")({
  component: NewBundlePage,
  validateSearch: searchSchema,
});

function NewBundlePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productId } = Route.useSearch();
  const formRef = useRef<BundleFormHandle>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(values: BundleInput) {
    const created = await createBundle(values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.bundles.all });
    toast.success(`Created “${created.name}”.`);
    navigate({
      to: "/catalog/bundles/$bundleId",
      params: { bundleId: created.id },
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
            {pending ? "Creating…" : "Create bundle"}
          </Button>
        }
        description="Group products into a priced combo."
        title="New bundle"
      />
      <BundleForm
        initialProductId={productId}
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
      />
    </>
  );
}
