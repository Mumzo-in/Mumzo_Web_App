import { Button } from "@mumzo/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Empty data-testid="admin-not-found">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Compass />
          </EmptyMedia>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>
            That route doesn't exist in the control panel.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button data-testid="admin-not-found-home" render={<Link to="/" />}>
            Back to dashboard
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}

export default NotFound;
