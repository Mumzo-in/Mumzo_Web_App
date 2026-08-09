export {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  type Product,
  type ProductInput,
  type ProductVariant,
  type ProductVariantInput,
  type ProductVendorInput,
  updateProduct,
} from "./api/products-api";
export {
  DEFAULT_SIZE_LABEL,
  default as ProductForm,
  normalizeSizes,
  type ProductFormHandle,
  type ProductFormValues,
  ProductSettingsMenu,
  type ProductSizeInput,
} from "./components/product-form";
export { default as ProductTable } from "./components/product-table";
export { productQueryOptions } from "./queries/products";
