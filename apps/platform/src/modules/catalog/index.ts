export type { Offer, Product } from "../../core/data";
export {
  // `findProduct`/`productsInCategory` remain for the not-yet-migrated
  // cart/wishlist/order consumers — see `../../core/data.ts`'s header
  // comment. The core browsing path (search, PDP, rails) now reads live
  // data via `productsQueryOptions`/`productQueryOptions` below.
  findProduct,
  offers,
  products,
  productsInCategory,
} from "../../core/data";
export { getBrand, listBrands, type PublicBrand } from "./api/brands-api";
export {
  getCategory,
  listCategories,
  type PublicCategory,
} from "./api/categories-api";
export {
  getProduct as getPublicProduct,
  type ListProductsFilters,
  listProducts as listPublicProducts,
  listProductsByCategory as listPublicProductsByCategory,
  type ProductSort,
  type PublicProduct,
  type PublicProductSize,
} from "./api/products-api";
export { default as BrandCard } from "./components/brand/brand-card";
export { default as CategoryCard } from "./components/category/category-card";
export { default as CategoryFilterDialog } from "./components/category/category-filter-dialog";
export { default as CategoryFilterPanel } from "./components/category/category-filter-panel";
export { default as CategoryLink } from "./components/category/category-link";
export { default as CategorySort } from "./components/category/category-sort";
export { default as CollectionCard } from "./components/collection/collection-card";
export { default as ProductAccordion } from "./components/product/product-accordion";
export { default as ProductCard } from "./components/product/product-card";
export { default as ProductImageCarousel } from "./components/product/product-image-carousel";
export { default as ProductQuantitySelector } from "./components/product/product-quantity-selector";
export { default as ProductRail } from "./components/product/product-rail";
export { default as ProductSizeSelector } from "./components/product/product-size-selector";
export { default as RecommendationCard } from "./components/product/recommendation-card";
export { default as RelatedProducts } from "./components/product/related-products";
export { brandSlug, productsByBrand } from "./data/brand-data";
export {
  activeFilterCount,
  applyCategoryFilters,
  applyClientOnlyFilters,
  type CategoryFacets,
  type CategoryFilterState,
  getCategoryFacets,
  initialFilterState,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  type PriceDirection,
  type PriceFilter,
  rupee,
  SORTS,
  type SortKey,
  type SortOption,
} from "./data/category-config";
export {
  type Collection,
  collections,
  findCollection,
  productsInCollection,
} from "./data/collection-data";
export {
  categoryOgImage,
  defaultOgImage,
  productOgImage,
} from "./data/og-image";
export { toProduct } from "./data/product-adapter";
export {
  AGE_GROUPS,
  AGE_LABEL,
  type AgeGroup,
  agesIn,
  productAges,
  productType,
  typesIn,
} from "./data/product-attributes";
export {
  type Review,
  type ReviewSummary,
  reviewSummary,
  seedReviews,
} from "./data/review-data";
export { brandQueryOptions, brandsQueryOptions } from "./queries/brands";
export { categoriesQueryOptions } from "./queries/categories";
export {
  INFINITE_PAGE_SIZE,
  productQueryOptions,
  productsByCategoryQueryOptions,
  productsInfiniteQueryOptions,
  productsQueryOptions,
} from "./queries/products";
