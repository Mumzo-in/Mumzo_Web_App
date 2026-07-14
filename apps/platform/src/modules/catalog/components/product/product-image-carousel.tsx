import { Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProductImageCarouselProps {
  img: string;
  name: string;
  discount: number;
}

export default function ProductImageCarousel({
  img,
  name,
  discount,
}: ProductImageCarouselProps) {
  const [activeThumb, setActiveThumb] = useState(0);
  const [saved, setSaved] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleWishlist = () => {
    setSaved(!saved);
    toast.success(saved ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/50 bg-accent/10">
        <img src={img} alt={name} className="h-full w-full object-cover" />
        {discount > 0 && (
          <span className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1 font-bold text-primary-foreground text-xs">
            {discount}% OFF
          </span>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            type="button"
            onClick={handleWishlist}
            data-testid="web-wishlist"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-white/95 transition-transform hover:border-primary active:scale-95"
          >
            <Heart
              size={16}
              fill={saved ? "var(--primary)" : "none"}
              color={saved ? "var(--primary)" : "currentColor"}
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
      {/* Thumbnails */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <button
            type="button"
            key={i.toString()}
            onClick={() => setActiveThumb(i)}
            className={`aspect-square cursor-pointer overflow-hidden rounded-2xl border transition-all ${
              i === activeThumb
                ? "border-primary opacity-100 ring-2 ring-primary/20"
                : "border-border/50 opacity-70 hover:opacity-100"
            }`}
          >
            <img
              src={img}
              className="h-full w-full object-cover"
              alt={`${name} thumb ${i}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
