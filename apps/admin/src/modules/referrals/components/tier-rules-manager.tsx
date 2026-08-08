import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { Switch } from "@mumzo/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { queryKeys } from "@/core/api/query-keys";
import { formatNumber } from "@/core/components/format";
import { getReferralConfig } from "../api/referrals-api";

/**
 * Programme rules + the tier ladder. Read-only base UI for now — the write
 * actions (save rules, add tier) land with the API.
 */
export function TierRulesManager() {
  const configQuery = useQuery({
    queryKey: queryKeys.referrals.config(),
    queryFn: getReferralConfig,
  });

  const config = configQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Programme rules</CardTitle>
          <CardDescription>
            The settlement engine's knobs — how coupons get issued and revoked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!config ? (
            <Skeleton className="h-24 rounded-2xl" />
          ) : (
            <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="return-window">
                  Return window (days)
                </FieldLabel>
                <Input
                  data-testid="referral-return-window"
                  defaultValue={config.rules.returnWindowDays}
                  id="return-window"
                  type="number"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="coupon-validity">
                  Coupon validity (days)
                </FieldLabel>
                <Input
                  data-testid="referral-coupon-validity"
                  defaultValue={config.rules.couponValidityDays}
                  id="coupon-validity"
                  type="number"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="monthly-cap">
                  Monthly cap / user
                </FieldLabel>
                <Input
                  data-testid="referral-monthly-cap"
                  defaultValue={config.rules.monthlyCapPerUser}
                  id="monthly-cap"
                  type="number"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="referee-reward">
                  Friend's first-order reward (₹)
                </FieldLabel>
                <Input
                  data-testid="referral-referee-reward"
                  defaultValue={config.rules.refereeReward}
                  id="referee-reward"
                  type="number"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="code-pattern">Code pattern</FieldLabel>
                <Input
                  data-testid="referral-code-pattern"
                  defaultValue={config.codePattern}
                  id="code-pattern"
                />
              </Field>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="self-referral-block">
                  Block self-referral
                </FieldLabel>
                <Switch
                  checked={config.rules.selfReferralBlock}
                  data-testid="referral-self-block"
                  id="self-referral-block"
                />
              </Field>
            </FieldGroup>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-warm">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Reward tiers</CardTitle>
            <CardDescription>
              Unlocked by successful-referral count. Each milestone issues one
              coupon.
            </CardDescription>
          </div>
          <Button
            data-testid="referral-add-tier"
            disabled
            size="sm"
            variant="outline"
          >
            <Plus data-icon="inline-start" />
            Add tier
          </Button>
        </CardHeader>
        <CardContent>
          {!config ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <div className="overflow-x-auto border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Coupon</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">{tier.name}</TableCell>
                      <TableCell className="numeric">
                        {tier.threshold}
                      </TableCell>
                      <TableCell className="numeric">
                        ₹{tier.couponAmount}
                      </TableCell>
                      <TableCell className="numeric">
                        {formatNumber(tier.membersInTier)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tier.isActive ? "secondary" : "outline"}
                        >
                          {tier.isActive ? "Active" : "Draft"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TierRulesManager;
