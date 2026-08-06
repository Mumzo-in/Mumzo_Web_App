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
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import { usePermission } from "@/modules/roles";
import {
  VENDOR_TYPE_LABEL,
  VendorInvoicesTable,
  VendorProductsTable,
  VendorSalesSummary,
  VendorStats,
  vendorQueryOptions,
} from "@/modules/vendor";

export const Route = createFileRoute("/(admin)/catalog/vendors/$vendorId/")({
  component: VendorDetailPage,
});

function VendorDetailPage() {
  const { vendorId } = Route.useParams();
  const canWrite = usePermission("vendor", "update");

  const { data: vendor, isLoading } = useQuery(vendorQueryOptions(vendorId));

  if (isLoading || !vendor) {
    return <Loader />;
  }

  return (
    <>
      <PageHeader
        actions={
          canWrite ? (
            <Button
              data-testid="admin-vendor-edit-header"
              render={
                <Link
                  params={{ vendorId }}
                  to="/catalog/vendors/$vendorId/edit"
                />
              }
              variant="outline"
            >
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
          ) : undefined
        }
        description={vendor.slug}
        title={vendor.name}
      />

      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-warm">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-lg">{vendor.name}</span>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip
              label={vendor.isActive ? "Active" : "Inactive"}
              tint={
                vendor.isActive
                  ? "bg-sage text-ink"
                  : "bg-secondary text-muted-foreground"
              }
            />
            <StatusChip
              label={VENDOR_TYPE_LABEL[vendor.type]}
              tint="bg-peach text-ink"
            />
          </div>
          {vendor.contacts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No contact details on file.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {vendor.contacts.map((contact) => (
                <div
                  className="flex flex-wrap items-center gap-2 text-sm"
                  key={contact.name}
                >
                  {contact.isPrimary ? (
                    <Badge variant="secondary">Primary</Badge>
                  ) : null}
                  <span className="text-muted-foreground">
                    {[contact.name, contact.phone, contact.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="text-muted-foreground text-sm">
            {[vendor.address, vendor.city, vendor.state, vendor.pincode]
              .filter(Boolean)
              .join(", ") || "No address on file."}
          </p>
        </div>
      </div>

      <VendorStats vendor={vendor} />

      <Tabs defaultValue="products">
        <TabsList className="bg-card">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <VendorProductsTable vendorId={vendorId} />
        </TabsContent>
        <TabsContent value="invoices">
          <VendorInvoicesTable vendorId={vendorId} />
        </TabsContent>
        <TabsContent value="sales">
          <VendorSalesSummary vendorId={vendorId} />
        </TabsContent>
      </Tabs>
    </>
  );
}
