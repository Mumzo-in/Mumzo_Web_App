import { discountPct, isPurchasable } from "@mumzo/schema";
import { RichTextView } from "@mumzo/ui/components/rich-text-view";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart, Share2, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Breadcrumbs from "@/core/components/breadcrumbs";
import { useCart } from "@/modules/cart";
import {
  categoriesQueryOptions,
  ProductImageCarousel,
  ProductQuantitySelector,
  ProductSizeSelector,
  productOgImage,
  productQueryOptions,
  productsByCategoryQueryOptions,
  RecommendationCard,
  toProduct,
} from "@/modules/catalog";
import { useWishlist } from "@/modules/wishlist";

export const Route = createFileRoute("/(store)/product/$productId/")({
  component: ProductDetailPage,
  head: ({ params }) => ({
    meta: [
      { property: "og:image", content: productOgImage(params.productId) },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();

  const {
    data: rawProduct,
    isLoading,
    isError,
  } = useQuery(productQueryOptions(productId));
  const product = useMemo(() => {
    return rawProduct ? toProduct(rawProduct) : undefined;
  }, [rawProduct]);
  const { data: categories = [] } = useQuery(categoriesQueryOptions);
  const category = product
    ? (categories.find((c) => c.slug === product.categorySlug) ?? null)
    : null;

  // Default to the first size that's actually in stock, not merely the
  // first — recomputed via effect since the product now loads async. Colors
  // are a separate axis with their own default-in-stock pick; a product
  // carries one or the other, not both, in practice.
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only initialize size on product load
  useEffect(() => {
    setSize(product?.sizes.find((s) => s.stock > 0)?.label ?? null);
    setColor(product?.colors.find((c) => c.stock > 0)?.label ?? null);
  }, [product?.id]);

  // Hook must run unconditionally (before the loading/not-found guards
  // below) — disabled until the product (and so its category) is known.
  const { data: relatedPage } = useQuery({
    ...productsByCategoryQueryOptions(product?.categorySlug ?? "", {
      limit: 5,
    }),
    enabled: Boolean(product),
  });

  if (isLoading) {
    return (
      <div
        data-testid="web-product-page"
        className="mx-auto max-w-[1280px] bg-background px-0 pt-4 pb-12 md:pt-8"
      >
        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:gap-16">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="flex flex-col gap-4 pt-5 md:pt-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-12 text-center">
        <h2 className="mb-4 font-editorial text-2xl">Product not found.</h2>
        <Link to="/" className="font-semibold text-primary hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  // Real variants now, rather than slicing a hardcoded global by category.
  const availableSizes = product.sizes.map((s) => s.label);
  const needsSize = product.sizes.length > 0;
  const selectedSize = product.sizes.find((s) => s.label === size) ?? null;

  // Colors are a separate axis — only relevant when the product has no
  // sizes (the two are mutually exclusive in practice).
  const availableColors = product.colors.map((c) => c.label);
  const needsColor = !needsSize && product.colors.length > 0;
  const selectedColor = needsColor
    ? (product.colors.find((c) => c.label === color) ?? null)
    : null;

  const selectedVariant = selectedSize ?? selectedColor;
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayMrp = selectedVariant
    ? product.price > 0
      ? Math.round((selectedVariant.price * product.mrp) / product.price)
      : selectedVariant.price
    : product.mrp;

  // The chosen variant governs availability; fall back to product stock when
  // the product has no variants at all.
  const stockForSelection = selectedVariant
    ? selectedVariant.stock
    : product.stock;
  const soldOut = !isPurchasable(product) || stockForSelection === 0;

  const related = (relatedPage?.data ?? [])
    .map(toProduct)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const handleAdd = () => {
    if (soldOut || (needsSize && !size) || (needsColor && !color)) {
      return;
    }
    addItem(product, size ?? color, qty);
    toast.success(`${product.name} added to cart!`);
    navigate({ to: "/cart" });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleWishlist = () => {
    // No optimistic toast — `toggle` may just open the sign-in modal, or
    // resolve asynchronously; `WishlistProvider` itself owns the toast.
    toggle(product.id);
  };
  const wished = has(product.id);

  return (
    <div
      data-testid="web-product-page"
      className="mx-auto max-w-[1280px] bg-background px-0 pt-4 pb-12 md:pt-8"
    >
      {/* Breadcrumb component (hidden on mobile, visible on desktop) */}
      <div className="hidden md:block">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            {
              label: category?.name || "Category",
              to: "/search",
              search: { cat: product.categorySlug },
            },
            { label: product.name },
          ]}
        />
      </div>

      {/* Mobile Header Back Row (visible on mobile, hidden on desktop) */}
      <div className="mb-4 flex items-center md:hidden">
        <Link
          to="/search"
          search={{
            cat: product.categorySlug,
          }}
          data-testid="back-btn"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white transition-transform active:scale-95"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </Link>

        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            {
              label: category?.name || "Category",
              to: "/search",
              search: { cat: product.categorySlug },
            },
            { label: product.name },
          ]}
          className="mb-0 ml-4"
        />
      </div>

      {/* Main split grid */}
      <div className="mt-4 grid gap-6 md:grid-cols-2 lg:gap-16">
        {/* Left column: image & thumbnails */}

        <ProductImageCarousel
          images={product.images}
          name={product.name}
          discount={discountPct(product)}
        />

        {/* Right column: info & selectors */}
        <div className="flex flex-col pt-5 md:px-0 md:pt-0">
          <div className="flex items-start justify-between gap-4">
            <Link
              to="/brand/$brand"
              params={{ brand: product.brandId }}
              className="font-semibold text-[11px] text-primary uppercase tracking-widest transition-opacity hover:opacity-70 md:text-xs"
            >
              {product.brand}
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleWishlist}
                data-testid="web-product-wishlist"
                aria-label={
                  wished ? "Remove from wishlist" : "Save to wishlist"
                }
                aria-pressed={wished}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-border/60 text-foreground/60 transition-colors hover:text-primary"
              >
                <Heart
                  size={15}
                  className={wished ? "fill-primary text-primary" : undefined}
                />
              </button>
              <button
                type="button"
                onClick={handleShare}
                data-testid="web-product-share"
                aria-label="Copy product link"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-border/60 text-foreground/60 transition-colors hover:text-primary"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>

          {/* Title & Review Rating row on mobile, standard display on desktop */}
          <div className="mt-1 flex items-start justify-between gap-4">
            <h1 className="flex-1 font-editorial text-2xl text-ink leading-tight md:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            {/* Mobile-only Rating */}
            <div className="flex flex-shrink-0 flex-col items-end md:hidden">
              <div className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-accent/20 px-2.5 py-0.5">
                <Star
                  size={12}
                  className="fill-current text-primary"
                  strokeWidth={0}
                />
                <span className="font-semibold text-primary text-xs">
                  {product.rating}
                </span>
              </div>
              <span className="mt-1 text-[10px] text-foreground/50">
                2.3k reviews
              </span>
            </div>
          </div>
          <p className="mt-1 text-foreground/60 text-sm">{product.qty}</p>

          {/* Desktop-only Rating */}
          <div className="mt-4 hidden items-center gap-2 md:flex">
            <div className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-accent/20 px-2.5 py-0.5">
              <Star
                size={12}
                className="fill-current text-primary"
                strokeWidth={0}
              />
              <span className="font-semibold text-primary text-xs">
                {product.rating}
              </span>
            </div>
            <span className="text-foreground/50 text-xs">2.3k reviews</span>
          </div>

          <div className="my-6 border-border/60 border-t" />

          {/* Pricing */}
          <div className="flex items-end gap-3">
            <span className="animate-fade-in font-editorial text-3xl text-foreground md:text-4xl">
              ₹{displayPrice}
            </span>
            {displayMrp > displayPrice && (
              <>
                <span className="mb-1 text-foreground/45 text-sm line-through md:text-base">
                  ₹{displayMrp}
                </span>
                <span className="mb-1 font-semibold text-primary text-sm md:text-base">
                  {discountPct({ price: displayPrice, mrp: displayMrp })}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-1.5 text-foreground/55 text-xs">
            Inclusive of all taxes
          </p>

          {/* Size selector if needed */}
          {needsSize && (
            <ProductSizeSelector
              sizes={availableSizes}
              selectedSize={size}
              onSelectSize={setSize}
            />
          )}

          {/* Color selector — separate axis, only when the product has no
              sizes. Reuses the same pill-selector pattern. */}
          {needsColor && (
            <ProductSizeSelector
              sizes={availableColors}
              selectedSize={color}
              onSelectSize={setColor}
            />
          )}

          {/* Quantity Selector */}
          <ProductQuantitySelector qty={qty} onQtyChange={setQty} />

          {/* Action Button */}
          <div className="mt-6 flex max-w-sm gap-4 md:mt-8">
            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut}
              data-testid="add-to-cart"
              className="md:mumzo-btn flex h-12 w-full cursor-pointer select-none items-center justify-center rounded-full bg-primary py-3.5 font-semibold text-primary-foreground text-sm transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:py-4 md:font-normal"
            >
              {soldOut ? "Out of stock" : "Add to cart →"}
            </button>
          </div>
          {soldOut ? (
            <p
              className="mt-2 text-muted-foreground text-xs"
              data-testid="product-oos-note"
            >
              {needsSize && stockForSelection === 0 && isPurchasable(product)
                ? "This size is sold out — try another."
                : "We're restocking this one. Check back soon."}
            </p>
          ) : null}

          {/* About this product & Highlights (Static UI with identical typography across all screens) */}
          <div className="mt-10 space-y-6 border-border/60 border-t pt-6">
            <div>
              <h2 className="font-semibold text-foreground/55 text-xs uppercase tracking-widest">
                About this product
              </h2>
              {/* Authored in the admin as rich text; the generic line is a
                  fallback for catalogue entries that predate the field. */}
              {product.about ? (
                <RichTextView
                  className="mt-3 text-foreground/75"
                  html={product.about}
                />
              ) : (
                <p className="mt-3 text-foreground/75 text-sm leading-relaxed">
                  {`Carefully sourced and mom-approved. ${product.name} from ${product.brand} is designed to be gentle on your little one.`}
                </p>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-foreground/55 text-xs uppercase tracking-widest">
                Highlights
              </h2>
              <ul className="mt-3 space-y-1.5 text-foreground/75 text-sm">
                {product.highlights.map((highlight) => (
                  <li key={highlight}>• {highlight}</li>
                ))}
                <li>• Category: {category?.name || "Baby essentials"}</li>
                <li>• Brand: {product.brand}</li>
                <li>• Pack size: {product.qty}</li>
                <li>• Country of origin: {product.countryOfOrigin}</li>
                <li>• Manufactured for Mumzo Retail Pvt. Ltd.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-12 border-border/60 border-t pt-8 md:mt-16 md:px-0 md:pt-10">
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
      )}
    </div>
  );
}
