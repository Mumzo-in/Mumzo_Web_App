import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { CartBlockingOverlay, useCart } from "@/modules/cart";
import {
  ProductCard,
  productsQueryOptions,
  toProduct,
} from "@/modules/catalog";
import { useWishlist } from "@/modules/wishlist";

export const Route = createFileRoute("/(store)/(protected)/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { isMutating } = useCart();
  const { ids, isLoading: wishlistLoading } = useWishlist();
  // A wishlisted id is a real product uuid (`ProductCard` toggles
  // `product.id`, and products are live now) — pull a generous live page and
  // filter, rather than adding a per-id endpoint just for this page.
  const { data: page, isLoading: productsLoading } = useQuery(
    productsQueryOptions({ limit: 100 }),
  );
  const isLoading = wishlistLoading || productsLoading;
  const wished = (page?.data ?? [])
    .map(toProduct)
    .filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto max-w-[1280px] pt-8 pb-16">
      <CartBlockingOverlay active={isMutating} />
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Wishlist" }]}
      />

      <div className="mb-8">
        <h1 className="font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
          Your wishlist
        </h1>
        {!isLoading && (
          <p className="mt-2 text-foreground/60 text-sm">
            {wished.length} {wished.length === 1 ? "item" : "items"} saved for
            later
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton count, never reordered
            <Skeleton key={i} className="aspect-3/4 rounded-2xl" />
          ))}
        </div>
      ) : wished.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-white py-20 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-primary/10 bg-accent/20">
            <Heart size={28} className="text-primary" />
          </div>
          <p className="font-editorial text-2xl text-ink">Nothing saved yet</p>
          <p className="mt-2 text-foreground/60 text-sm">
            Tap the heart on any product to keep it here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
          >
            Explore products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {wished.map((product) => (
            <ProductCard key={product.id} product={product} blocking />
          ))}
        </div>
      )}
    </div>
  );
}
