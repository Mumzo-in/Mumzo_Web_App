import { cn } from "@mumzo/ui/lib/utils";
import { ImageOff } from "lucide-react";
import { useState } from "react";

/**
 * Thumbnail strip + main image — admin-appropriate preview, not the
 * customer-facing carousel (no autoplay/zoom/swipe). Falls back to a plain
 * placeholder when a product has no images yet.
 */
export function ProductPreviewGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-border bg-secondary">
        <ImageOff className="size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
        <img
          alt={name}
          className="size-full object-cover"
          src={images[active]}
        />
      </div>
      {images.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((src, index) => (
            <button
              key={src}
              className={cn(
                "size-14 shrink-0 overflow-hidden rounded-lg border transition-colors",
                index === active
                  ? "border-primary"
                  : "border-border hover:border-primary/40",
              )}
              onClick={() => setActive(index)}
              type="button"
            >
              <img alt="" className="size-full object-cover" src={src} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default ProductPreviewGallery;
