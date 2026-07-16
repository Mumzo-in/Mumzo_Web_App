import { Badge } from "@mumzo/ui/components/badge";
import { Card, CardContent } from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { queryKeys } from "@/core/api/query-keys";
import { formatDate } from "@/core/components/format";
import { listLegalPages } from "../api/legal-pages-api";

const SKELETONS = ["l1", "l2", "l3", "l4"] as const;

export function LegalPageList() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.cmsPages.lists(),
    queryFn: listLegalPages,
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-3">
        {SKELETONS.map((key) => (
          <Skeleton key={key} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="admin-legal-page-list">
      {data.map((page) => (
        <Card key={page.slug} className="shadow-warm">
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <div className="flex flex-1 flex-col gap-0.5">
              <Link
                to="/legal/pages/$pageSlug"
                params={{ pageSlug: page.slug }}
                className="font-medium transition-colors hover:text-primary"
                data-testid={`admin-legal-${page.slug}`}
              >
                {page.title}
              </Link>
              <span className="numeric text-muted-foreground text-sm">
                {page.publicPath}
              </span>
            </div>
            <span className="numeric text-muted-foreground text-sm">
              Updated {formatDate(page.updatedAt)}
            </span>
            <Badge variant={page.isPublished ? "secondary" : "outline"}>
              {page.isPublished ? "Published" : "Draft"}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default LegalPageList;
