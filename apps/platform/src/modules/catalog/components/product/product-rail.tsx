import type { Product } from "@/core/data";
import ProductCard from "./product-card";

/**
 * Horizontal, snap-scrolling product rail — the workhorse of the home page.
 * Keeps product density high without forcing a tall grid.
 */
export default function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {products.map((product) => (
        <div
          key={product.id}
          className="w-40 shrink-0 snap-start sm:w-48 lg:w-56"
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
