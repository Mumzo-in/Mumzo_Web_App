import { discountPct } from "@mumzo/catalog-model";
import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Images, PackageOpen } from "lucide-react";
import { queryKeys } from "@/core/api/query-keys";
import { formatMoney, formatNumber } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import { getProduct, PRODUCT_STATUS_META } from "@/modules/catalog-products";

export const Route = createFileRoute("/(admin)/catalog/products/$productId/")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => getProduct(productId),
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
            <Button
              data-testid="admin-product-stock"
              render={
                <Link
                  to="/catalog/products/$productId/stock"
                  params={{ productId: data.id }}
                />
              }
            >
              <PackageOpen data-icon="inline-start" />
              Update stock
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
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
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <StatusChip label={status.label} tint={status.tint} />
            <span className="numeric text-sm">
              {formatNumber(data.stock)} in stock
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.tags.length === 0 ? (
              <span className="text-muted-foreground text-sm">No tags</span>
            ) : (
              data.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full">
                  {tag}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Pack sizes and their own stock.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.sizes.map((size) => (
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
                  {formatNumber(size.stock)} in stock
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
