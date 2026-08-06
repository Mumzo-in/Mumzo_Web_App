import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@mumzo/ui/components/avatar";
import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@mumzo/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import {
  BrandProductsTable,
  BrandStats,
  BrandVendorsTable,
  brandQueryOptions,
} from "@/modules/brand";
import { categoriesQueryOptions } from "@/modules/category";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/brands/$brandId/")({
  component: BrandDetailPage,
});

function BrandDetailPage() {
  const { brandId } = Route.useParams();
  const canWrite = usePermission("brand", "update");

  const { data: brand, isLoading } = useQuery({
    ...brandQueryOptions(brandId),
    queryKey: queryKeys.brands.detail(brandId),
  });
  const { data: categories } = useQuery(categoriesQueryOptions);

  if (isLoading || !brand) {
    return <Loader />;
  }

  const categoryNames = brand.categorySlugs.map(
    (slug) =>
      categories?.find((category) => category.slug === slug)?.name ?? slug,
  );

  return (
    <>
      <PageHeader
        actions={
          canWrite ? (
            <Button
              data-testid="admin-brand-edit-header"
              render={
                <Link params={{ brandId }} to="/catalog/brands/$brandId/edit" />
              }
              variant="outline"
            >
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
          ) : undefined
        }
        description={brand.slug}
        title={brand.name}
      />

      <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-warm">
        <Avatar size="lg">
          {brand.logoUrl ? <AvatarImage alt="" src={brand.logoUrl} /> : null}
          <AvatarFallback>{brand.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-lg">{brand.name}</span>
          <StatusChip
            label={brand.isActive ? "Active" : "Inactive"}
            tint={
              brand.isActive
                ? "bg-sage text-ink"
                : "bg-secondary text-muted-foreground"
            }
          />
          <div className="flex flex-wrap gap-1.5">
            {categoryNames.length === 0 ? (
              <span className="text-muted-foreground text-xs">
                No categories assigned.
              </span>
            ) : (
              categoryNames.map((name) => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>

      <BrandStats brand={brand} />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <BrandProductsTable brandId={brandId} />
        </TabsContent>
        <TabsContent value="vendors">
          <BrandVendorsTable brandId={brandId} />
        </TabsContent>
      </Tabs>
    </>
  );
}
