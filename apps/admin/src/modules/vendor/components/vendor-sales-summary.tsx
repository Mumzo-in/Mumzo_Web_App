import { Card, CardContent } from "@mumzo/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { formatMoney, formatNumber } from "@/core/components/format";
import Loader from "@/core/components/loader";
import { NeedsBackendNotice } from "@/core/components/needs-backend-notice";
import { vendorSaleSummaryQueryOptions } from "../queries/vendors";

export function VendorSalesSummary({ vendorId }: { vendorId: string }) {
  const { data, isLoading } = useQuery(vendorSaleSummaryQueryOptions(vendorId));

  if (isLoading || !data) {
    return <Loader />;
  }

  return (
    <div
      className="flex flex-col gap-3"
      data-testid="admin-vendor-sales-summary"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-warm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-xs">
              Units sold (30d)
            </span>
            <span className="numeric font-bold font-serif text-2xl">
              {formatNumber(data.last30DaysUnits)}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-warm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-xs">Revenue (30d)</span>
            <span className="numeric font-bold font-serif text-2xl">
              {formatMoney(data.last30DaysRevenue)}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-warm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-xs">
              Total units sold
            </span>
            <span className="numeric font-bold font-serif text-2xl">
              {formatNumber(data.totalUnits)}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-warm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-xs">Total revenue</span>
            <span className="numeric font-bold font-serif text-2xl">
              {formatMoney(data.totalRevenue)}
            </span>
          </CardContent>
        </Card>
      </div>

      <NeedsBackendNotice>
        Sales figures are mock-derived — need an order-line-to-vendor aggregate
        endpoint on the server before this is real.
      </NeedsBackendNotice>
    </div>
  );
}

export default VendorSalesSummary;
