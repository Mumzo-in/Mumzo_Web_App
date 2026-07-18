export {
  CATEGORY_SLUGS,
  type Category,
  type CategorySlug,
  isCategorySlug,
  LEGACY_CATEGORY_SLUGS,
  resolveCategorySlug,
} from "./category";
export {
  AGE_GROUPS,
  AGE_LABEL,
  type AgeGroup,
  discountPct,
  isLowStock,
  isPurchasable,
  LOW_STOCK_THRESHOLD,
  marginPct,
  type Product,
  type ProductSize,
  type ProductStatus,
  primaryImage,
  totalStock,
} from "./product";
export {
  type ProductFormOutput,
  type ProductFormValues,
  productFormSchema,
  productSizeSchema,
  slugify,
} from "./product-schema";
