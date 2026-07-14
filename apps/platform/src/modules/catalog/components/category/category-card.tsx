import { Link } from "@tanstack/react-router";
import type { Category } from "../../index";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      data-testid={`web-cat-${category.slug}`}
      className="group relative aspect-[1/1.05] overflow-hidden rounded-2xl border border-border/50 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(31,27,58,0.10)]"
      style={{ background: category.color }}
    >
      <img
        src={category.img}
        alt={category.name}
        loading="lazy"
        className="absolute right-[-8%] bottom-[-6%] h-[62%] w-[70%] rounded-2xl object-cover shadow-md transition-transform duration-500 group-hover:scale-105"
      />
      <div className="relative p-4">
        <p className="text-[10px] text-foreground/60 uppercase tracking-widest">
          Shelf
        </p>
        <p className="mt-1 max-w-[70%] font-editorial text-lg leading-tight">
          {category.name}
        </p>
        <p className="mt-1 max-w-[65%] text-[11px] text-foreground/55">
          {category.tagline}
        </p>
      </div>
    </Link>
  );
}
