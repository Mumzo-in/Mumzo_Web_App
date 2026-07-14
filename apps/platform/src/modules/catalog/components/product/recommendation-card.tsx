import type { Product } from "../../index";
import ProductCard from "./product-card";

interface RecommendationCardProps {
  product: Product;
}

export default function RecommendationCard({
  product,
}: RecommendationCardProps) {
  return (
    <ProductCard
      product={product}
      className="w-60 w-[170px] flex-shrink-0 md:w-full"
    />
  );
}
