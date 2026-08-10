import { Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProductImageCarouselProps {
  images: string[];
  name: string;
  discount: number;
  wished: boolean;
  onToggleWishlist: () => void;
}

/** Neutral wash shown when a product has no imagery yet. */
const PLACEHOLDER = "bg-accent/20";

export default function ProductImageCarousel({
  images,
  name,
  discount,
  wished,
  onToggleWishlist,
}: ProductImageCarouselProps) {
  const [activeThumb, setActiveThumb] = useState(0);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const activeImage = images[activeThumb] ?? images[0] ?? null;

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/50 bg-accent/10">
        {activeImage ? (
          <img
            src={activeImage}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`h-full w-full ${PLACEHOLDER}`} />
        )}
        {discount > 0 && (
          <span className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1 font-bold text-primary-foreground text-xs">
            {discount}% OFF
          </span>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            type="button"
            onClick={onToggleWishlist}
            data-testid="web-wishlist"
            aria-pressed={wished}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-white/95 transition-transform hover:border-primary active:scale-95"
          >
            <Heart
              size={16}
              fill={wished ? "var(--primary)" : "none"}
              color={wished ? "var(--primary)" : "currentColor"}
            />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-white/95 transition-transform hover:border-primary active:scale-95"
          >
            <Share2 size={16} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Thumbnails — only when there's more than one real image. */}
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              type="button"
              key={image}
              onClick={() => setActiveThumb(index)}
              className={`aspect-square cursor-pointer overflow-hidden rounded-2xl border transition-all ${
                index === activeThumb
                  ? "border-primary opacity-100 ring-2 ring-primary/20"
                  : "border-border/50 opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={image}
                className="h-full w-full object-cover"
                alt={`${name} ${index + 1}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
