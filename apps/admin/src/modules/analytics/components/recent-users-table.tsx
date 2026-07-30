import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { formatDateTime } from "@/core/components/format";
import type { RecentUserRow } from "../data/overview-analytics-data";

export function RecentUsersTable({
  data,
  isLoading,
}: {
  data: RecentUserRow[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card className="border border-border shadow-warm">
      <CardHeader>
        <CardTitle className="text-lg">Recent Signups</CardTitle>
        <CardDescription>Newest accounts in the customer base</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading || !data ? (
          <div className="flex flex-col gap-3 p-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Baby</TableHead>
                <TableHead className="pr-6 text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="pl-6 font-medium text-xs">
                    {user.name}
                  </TableCell>
                  <TableCell className="numeric text-muted-foreground text-xs">
                    {user.phoneNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {user.babyName
                      ? `${user.babyName}${user.babyAge ? ` (${user.babyAge})` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="numeric pr-6 text-right text-muted-foreground text-xs">
                    {formatDateTime(user.joinedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentUsersTable;
