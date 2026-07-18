import { Badge } from "@mumzo/ui/components/badge";
import { Card, CardContent } from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { GripVertical } from "lucide-react";
import { queryKeys } from "@/core/api/query-keys";
import { formatNumber } from "@/core/components/format";
import { listCategories } from "../api/categories-api";

const SKELETONS = ["c1", "c2", "c3", "c4", "c5"] as const;

/**
 * Categories are few and manually ordered, so this is a reorderable list
 * rather than a paginated table. Drag-reorder (`PATCH /categories/reorder`)
 * lands with the API — the handle is present but inert for now.
 */
export function CategoryList() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: listCategories,
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
    <div className="flex flex-col gap-3" data-testid="admin-category-list">
      {data.map((category) => (
        <Card key={category.slug} className="shadow-warm">
          <CardContent className="flex items-center gap-4 p-4">
            <GripVertical
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            {/* The category's storefront wash — inline because the value is
                author-supplied data, not a design token. */}
            <span
              className="size-8 shrink-0 rounded-full border"
              style={{ backgroundColor: category.color }}
              aria-hidden="true"
            />
            <div className="flex flex-1 flex-col gap-0.5">
              <Link
                to="/catalog/categories/$slug"
                params={{ slug: category.slug }}
                className="font-medium transition-colors hover:text-primary"
                data-testid={`admin-category-${category.slug}`}
              >
                {category.name}
              </Link>
              <span className="text-muted-foreground text-sm">
                {category.tagline}
              </span>
            </div>
            <span className="numeric text-muted-foreground text-sm">
              {formatNumber(category.productCount)} products
            </span>
            <Badge variant={category.isActive ? "secondary" : "outline"}>
              {category.isActive ? "Active" : "Hidden"}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default CategoryList;
