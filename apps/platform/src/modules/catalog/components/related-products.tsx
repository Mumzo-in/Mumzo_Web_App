import { productsInCategory } from "../index";
import RecommendationCard from "./recommendation-card";

interface RelatedProductsProps {
  categorySlug: string;
  currentProductId: string;
}

export default function RelatedProducts({
  categorySlug,
  currentProductId,
}: RelatedProductsProps) {
  const related = productsInCategory(categorySlug)
    .filter((p) => p.id !== currentProductId)
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 border-border/60 border-t px-5 pt-8 md:mt-16 md:px-0 md:pt-10">
      <h2 className="mb-4 font-editorial text-foreground text-xl md:mb-6 md:text-2xl lg:text-3xl">
        You may also like
      </h2>
      {/* Mobile: Horizontal scroll | Desktop: 4-column grid */}
      <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto scroll-smooth px-5 pb-4 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-x-visible md:px-0 md:pb-0">
        {related.map((p) => (
          <RecommendationCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
