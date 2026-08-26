import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Separator } from "@mumzo/ui/components/separator";
import { MapPin, Navigation, Phone } from "lucide-react";
import type { DeliveryRun } from "../data/delivery-data";
import { buildDirectionsUrl } from "../data/maps";

type DeliveryCustomerCardProps = {
  run: DeliveryRun;
};

/** Who and where — the two things a rider looks at first, with one-tap call
 * and navigate actions since this is read on a phone at the door. */
export function DeliveryCustomerCard({ run }: DeliveryCustomerCardProps) {
  // Works from coordinates when the address has them, and from the address
  // text when it does not — so the button is never dead.
  const directionsHref = buildDirectionsUrl(run);

  return (
    <Card data-testid="delivery-customer-card">
      <CardHeader>
        <CardTitle className="text-base">Delivery to</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">
            {run.customerName}
          </span>
          <span className="numeric text-muted-foreground text-sm">
            {run.customerPhone}
          </span>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <Badge variant="secondary">{run.addressLabel}</Badge>
          </div>
          <address className="flex flex-col gap-0.5 text-foreground text-sm not-italic">
            <span>{run.addressLine1}</span>
            {run.addressLine2 ? <span>{run.addressLine2}</span> : null}
            {run.addressLandmark ? (
              <span className="text-muted-foreground">
                Landmark: {run.addressLandmark}
              </span>
            ) : null}
            <span className="numeric text-muted-foreground">
              {run.addressCity} — {run.addressPincode}
            </span>
          </address>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            data-testid="delivery-call"
            render={<a href={`tel:${run.customerPhone}`} />}
          >
            <Phone data-icon />
            Call
          </Button>
          {directionsHref ? (
            <Button
              className="flex-1"
              data-testid="delivery-directions"
              render={
                <a href={directionsHref} target="_blank" rel="noreferrer" />
              }
            >
              <Navigation data-icon />
              Directions
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default DeliveryCustomerCard;
