import { Link } from "@tanstack/react-router";
import type { Category } from "@/core/data";

interface CategoryLinkProps {
  category: Category;
}

export default function CategoryLink({ category }: CategoryLinkProps) {
  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      className="whitespace-nowrap rounded-full border border-border/70 bg-white px-3.5 py-1.5 font-medium text-xs transition-colors hover:border-pinkDeep hover:text-pinkDeep"
    >
      {category.name}
    </Link>
  );
}
