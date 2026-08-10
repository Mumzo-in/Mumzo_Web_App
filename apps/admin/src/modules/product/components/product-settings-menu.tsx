import { PRODUCT_STATUSES, type ProductStatus } from "@mumzo/schema";
import { Button } from "@mumzo/ui/components/button";
import { Field, FieldLabel } from "@mumzo/ui/components/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mumzo/ui/components/popover";
import { Switch } from "@mumzo/ui/components/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@mumzo/ui/components/toggle-group";
import { Settings2 } from "lucide-react";

/** Status + bestseller toggle, rendered beside the Save/Create button. */
export function ProductSettingsMenu({
  status,
  isBestseller,
  isTopDeal,
  onStatusChange,
  onBestsellerChange,
  onTopDealChange,
}: {
  status: ProductStatus;
  isBestseller: boolean;
  isTopDeal: boolean;
  onStatusChange: (status: ProductStatus) => void;
  onBestsellerChange: (value: boolean) => void;
  onTopDealChange: (value: boolean) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            data-testid="admin-product-settings-trigger"
            size="icon"
            type="button"
            variant="outline"
          >
            <Settings2 />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Status</FieldLabel>
            <ToggleGroup
              className="flex-wrap"
              onValueChange={(value) => {
                const next = value.at(-1) as ProductStatus | undefined;
                if (next) {
                  onStatusChange(next);
                }
              }}
              value={[status]}
            >
              {PRODUCT_STATUSES.map((option) => (
                <ToggleGroupItem key={option} value={option}>
                  {option}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <FieldLabel htmlFor="product-bestseller">Bestseller</FieldLabel>
              <p className="text-muted-foreground text-xs">
                Manually flag it — not derived from rating.
              </p>
            </div>
            <Switch
              checked={isBestseller}
              id="product-bestseller"
              onCheckedChange={onBestsellerChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <FieldLabel htmlFor="product-top-deal">Top deal</FieldLabel>
              <p className="text-muted-foreground text-xs">
                Pins it to the storefront "Top deals" rail.
              </p>
            </div>
            <Switch
              checked={isTopDeal}
              id="product-top-deal"
              onCheckedChange={onTopDealChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
