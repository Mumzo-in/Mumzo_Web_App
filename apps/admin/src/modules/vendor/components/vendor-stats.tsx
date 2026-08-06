import { Card, CardContent } from "@mumzo/ui/components/card";
import { formatNumber } from "@/core/components/format";
import type { Vendor } from "../api/vendors-api";
import { PAYMENT_TERMS_LABEL } from "../data/vendor-data";

/** Product count and vendor details come from the real backend. */
export function VendorStats({ vendor }: { vendor: Vendor }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      data-testid="admin-vendor-stats"
    >
      <Card className="shadow-warm">
        <CardContent className="flex flex-col gap-1 pt-6">
          <span className="text-muted-foreground text-xs">Products</span>
          <span className="numeric font-bold font-serif text-2xl">
            {formatNumber(vendor.productCount)}
          </span>
        </CardContent>
      </Card>
      <Card className="shadow-warm">
        <CardContent className="flex flex-col gap-1 pt-6">
          <span className="text-muted-foreground text-xs">
            Default lead time
          </span>
          <span className="numeric font-bold font-serif text-2xl">
            {vendor.defaultLeadTimeDays ?? "—"}
            {vendor.defaultLeadTimeDays ? (
              <span className="ml-1 font-sans text-muted-foreground text-xs">
                days
              </span>
            ) : null}
          </span>
        </CardContent>
      </Card>
      <Card className="shadow-warm">
        <CardContent className="flex flex-col gap-1 pt-6">
          <span className="text-muted-foreground text-xs">Payment terms</span>
          <span className="font-bold font-serif text-lg">
            {PAYMENT_TERMS_LABEL[vendor.paymentTerms]}
          </span>
        </CardContent>
      </Card>
      <Card className="shadow-warm">
        <CardContent className="flex flex-col gap-1 pt-6">
          <span className="text-muted-foreground text-xs">Location</span>
          <span className="font-bold font-serif text-lg">
            {vendor.city ?? "—"}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

export default VendorStats;
