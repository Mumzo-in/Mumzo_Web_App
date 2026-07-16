import { Badge } from "@mumzo/ui/components/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Construction } from "lucide-react";

type ComingSoonProps = {
  title: string;
  description?: string;
  /** Roadmap phase from docs/superadmin/features.md. */
  phase?: 1 | 2 | 3;
  /** Set when api-plan §15 has no endpoints for this module yet. */
  needsApiSpec?: boolean;
};

/** Shared placeholder for routes whose module is specced but not built. */
export function ComingSoon({
  title,
  description,
  phase,
  needsApiSpec = false,
}: ComingSoonProps) {
  return (
    <Empty data-testid="admin-coming-soon">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Construction />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {description ?? "This screen hasn't been built yet."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {phase ? <Badge variant="secondary">Phase {phase}</Badge> : null}
          {needsApiSpec ? (
            <Badge variant="outline">Needs API spec</Badge>
          ) : null}
        </div>
      </EmptyContent>
    </Empty>
  );
}

export default ComingSoon;
