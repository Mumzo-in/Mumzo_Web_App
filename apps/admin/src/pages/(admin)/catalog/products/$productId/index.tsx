import { discountPct } from "@mumzo/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mumzo/ui/components/alert-dialog";
import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { RichTextView } from "@mumzo/ui/components/rich-text-view";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Images, Pencil, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { formatMoney, formatNumber } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import { BUNDLE_STATUS_META, listBundles } from "@/modules/bundle";
import {
  AdjustInventoryDialog,
  inventoryQueryOptions,
} from "@/modules/inventory";
import {
  deleteProduct,
  getProduct,
  PRODUCT_STATUS_META,
  ProductPreviewGallery,
  updateProduct,
} from "@/modules/product";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/products/$productId/")({
  component: ProductDetailPage,
});

const RELATED_BUNDLES_LIMIT = 5;

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [togglingStatus, setTogglingStatus] = useState(false);
  const canDelete = usePermission("product", "delete");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => getProduct(productId),
  });
  const inventory = useQuery(inventoryQueryOptions({ productId }));
  const inventoryRows = inventory.data ?? [];
  const totalStock = inventoryRows.reduce((sum, row) => sum + row.stock, 0);

  const bundles = useQuery({
    queryKey: [...queryKeys.bundles.lists(), "for-product", productId] as const,
    queryFn: () => listBundles({ productId, limit: RELATED_BUNDLES_LIMIT }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });
      toast.success("Product deleted.");
      navigate({ to: "/catalog/products" });
    },
    onError: (deleteError: Error) => {
      toast.error(deleteError.message || "Could not delete the product.");
      setConfirmingDelete(false);
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <PageHeader
        title="Product not found"
        description="This product doesn't exist or was removed."
      />
    );
  }

  const status = PRODUCT_STATUS_META[data.status];
  const off = discountPct(data);
  const isActive = data.status === "active";

  async function toggleActive() {
    if (!data) {
      return;
    }
    setTogglingStatus(true);
    try {
      const nextStatus = isActive ? "inactive" : "active";
      await updateProduct(data.id, {
        ...data,
        brandId: data.brandId,
        vendor: data.vendor
          ? {
              vendorId: data.vendor.vendorId,
              relationship: data.vendor.relationship,
              costPrice: data.vendor.costPrice,
              leadTimeDays: data.vendor.leadTimeDays,
              notes: data.vendor.notes,
            }
          : null,
        status: nextStatus,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });
      toast.success(
        nextStatus === "active" ? "Product activated." : "Product deactivated.",
      );
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error
          ? toggleError.message
          : "Couldn't update the product's status.",
      );
    } finally {
      setTogglingStatus(false);
    }
  }

  return (
    <>
      <PageHeader
        title={data.name}
        description={`${data.sku} · ${data.brand}`}
        actions={
          <>
            <Button
              variant="outline"
              data-testid="admin-product-images"
              render={
                <Link
                  to="/catalog/products/$productId/images"
                  params={{ productId: data.id }}
                />
              }
            >
              <Images data-icon="inline-start" />
              Images
            </Button>
            <AdjustInventoryDialog
              defaultProductId={data.id}
              defaultProductLabel={`${data.name} · ${data.sku}`}
            />
            <Button
              variant="outline"
              data-testid="admin-product-toggle-active"
              disabled={togglingStatus}
              onClick={toggleActive}
            >
              <Power data-icon="inline-start" />
              {isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              data-testid="admin-product-edit"
              render={
                <Link
                  to="/catalog/products/$productId/edit"
                  params={{ productId: data.id }}
                />
              }
            >
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
            {canDelete ? (
              <Button
                className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                data-testid="admin-product-delete"
                onClick={() => setConfirmingDelete(true)}
                variant="outline"
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingDelete(false);
          }
        }}
        open={confirmingDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {data.name} will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Gallery + at-a-glance summary */}
      <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
        <ProductPreviewGallery images={data.images} name={data.name} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="numeric font-editorial text-3xl tracking-tighter">
                {formatMoney(data.price)}
              </span>
              {off > 0 ? (
                <span className="numeric text-muted-foreground text-sm">
                  MRP {formatMoney(data.mrp)} · {off}% off
                </span>
              ) : null}
              <span className="text-muted-foreground text-xs">
                {data.qty}
                {data.weight ? ` · ${data.weight}` : ""}
              </span>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-3">
              <StatusChip label={status.label} tint={status.tint} />
              <span className="numeric text-sm">
                {inventory.isLoading
                  ? "Loading…"
                  : `${formatNumber(totalStock)} in stock across ${
                      inventoryRows.length
                    } hub${inventoryRows.length === 1 ? "" : "s"}`}
              </span>
            </CardContent>
          </Card>

          <Card className="shadow-warm sm:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <DetailRow label="Category" value={data.categorySlug} />
              <DetailRow label="Type" value={data.type || "—"} />
              <DetailRow label="Brand" value={data.brand} />
              <DetailRow
                label="Country of origin"
                value={data.countryOfOrigin}
              />
              <DetailRow
                label="Sourcing"
                value={
                  data.vendor
                    ? `${data.vendor.vendorName} (${data.vendor.relationship})`
                    : "Self-stocked"
                }
              />
              <DetailRow
                label="Bestseller"
                value={data.isBestseller ? "Yes" : "No"}
              />
              <DetailRow
                label="Rating"
                value={data.rating > 0 ? `${data.rating.toFixed(1)} / 5` : "—"}
              />
            </CardContent>
          </Card>

          {data.ages.length > 0 || data.tags.length > 0 ? (
            <Card className="shadow-warm sm:col-span-2">
              <CardHeader>
                <CardTitle>Ages & tags</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {data.ages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.ages.map((age) => (
                      <Badge key={age} className="rounded-full">
                        {age}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {data.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="rounded-full"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Description & highlights */}
      {data.about || data.highlights.length > 0 ? (
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>About this product</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.about ? (
              <RichTextView
                className="text-foreground/80 text-sm"
                html={data.about}
              />
            ) : null}
            {data.highlights.length > 0 ? (
              <ul className="flex flex-col gap-1.5 text-muted-foreground text-sm">
                {data.highlights.map((highlight) => (
                  <li key={highlight}>• {highlight}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Variants: sizes */}
      {data.sizes.length > 0 ? (
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Sizes</CardTitle>
            <CardDescription>
              Pack sizes and their stock across hubs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.sizes.map((size) => {
              const sizeStock = inventoryRows
                .filter((row) => row.productSizeId === size.id)
                .reduce((sum, row) => sum + row.stock, 0);
              return (
                <div
                  key={size.label}
                  className="flex items-center justify-between rounded-xl border px-4 py-3"
                >
                  <span className="text-sm">{size.label}</span>
                  <div className="flex items-center gap-6">
                    <span className="numeric text-sm">
                      {formatMoney(size.price)}
                    </span>
                    <span className="numeric text-muted-foreground text-sm">
                      {inventory.isLoading
                        ? "…"
                        : `${formatNumber(sizeStock)} in stock`}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Variants: colors */}
      {data.colors.length > 0 ? (
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Colors</CardTitle>
            <CardDescription>
              Color/style options and their stock across hubs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.colors.map((color) => {
              const colorStock = inventoryRows
                .filter((row) => row.productColorId === color.id)
                .reduce((sum, row) => sum + row.stock, 0);
              return (
                <div
                  key={color.label}
                  className="flex items-center justify-between rounded-xl border px-4 py-3"
                >
                  <span className="text-sm">{color.label}</span>
                  <div className="flex items-center gap-6">
                    <span className="numeric text-sm">
                      {formatMoney(color.price)}
                    </span>
                    <span className="numeric text-muted-foreground text-sm">
                      {inventory.isLoading
                        ? "…"
                        : `${formatNumber(colorStock)} in stock`}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Bundles containing this product */}
      {bundles.data && bundles.data.data.length > 0 ? (
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>In bundles</CardTitle>
            <CardDescription>
              Combos this product is sold as part of.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {bundles.data.data.map((bundle) => {
              const bundleStatus = BUNDLE_STATUS_META[bundle.status];
              return (
                <Link
                  key={bundle.id}
                  to="/catalog/bundles/$bundleId"
                  params={{ bundleId: bundle.id }}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:bg-secondary"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">{bundle.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {bundle.itemCount} products
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="numeric text-sm">
                      {formatMoney(bundle.price)}
                    </span>
                    <StatusChip
                      label={bundleStatus.label}
                      tint={bundleStatus.tint}
                    />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-border/50 border-b py-1 last:border-0 sm:border-0 sm:py-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
