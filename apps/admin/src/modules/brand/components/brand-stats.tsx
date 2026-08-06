import { Card, CardContent } from "@mumzo/ui/components/card";
import { formatNumber } from "@/core/components/format";
import { NeedsBackendNotice } from "@/core/components/needs-backend-notice";
import type { Brand } from "../api/brands-api";

/**
 * `productCount` is real (server-joined against the product table). Everything
 * else here — active/inactive split, stock, sales, ROI — has no backend
 * aggregate yet, so it's called out instead of presented as live data.
 */
export function BrandStats({ brand }: { brand: Brand }) {
  return (
    <div className="flex flex-col gap-3" data-testid="admin-brand-stats">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-warm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-xs">Products</span>
            <span className="numeric font-bold font-serif text-2xl">
              {formatNumber(brand.productCount)}
            </span>
          </CardContent>
        </Card>
      </div>

      <NeedsBackendNotice>
        Active products, units in stock, units sold, revenue and ROI need a
        products-by-brand and an orders aggregate endpoint on the server — not
        built yet, so they aren't shown here.
      </NeedsBackendNotice>
    </div>
  );
}

export default BrandStats;
