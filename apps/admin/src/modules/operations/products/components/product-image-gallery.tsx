import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@mumzo/ui/components/button";
import { Card } from "@mumzo/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Spinner } from "@mumzo/ui/components/spinner";
import { cn } from "@mumzo/ui/lib/utils";
import { GripVertical, ImagePlus, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  retireImage,
  useImageSlotUpload,
} from "@/core/api/use-image-slot-upload";

const TMP_URL_MARKER = "mumzo/tmp/";

/**
 * Multi-image upload & reorder for a product. Each image is uploaded through
 * `useImageSlotUpload` (draft session, `mumzo/tmp/{sessionId}/{slot}.webp`)
 * — the form only holds the resulting draft URLs plus the session id;
 * `uploadSessionId` is what the save submits so the server can finalize the
 * whole batch to `mumzo/admin/products/{productId}/{slot}.webp` in one move.
 * `images[0]` is the primary/cover image — drag it to the front to change it.
 */
export function ProductImageGallery({
  images,
  uploadSessionId,
  onChange,
  onSessionChange,
}: {
  images: string[];
  uploadSessionId: string | null;
  onChange: (next: string[]) => void;
  onSessionChange: (sessionId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef(uploadSessionId);
  sessionRef.current = uploadSessionId;
  const [retiringUrls, setRetiringUrls] = useState<Set<string>>(new Set());

  const nextSlot = images.length;
  const { status, upload } = useImageSlotUpload(`gallery-${nextSlot}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    for (const file of Array.from(files)) {
      try {
        const result = await upload(file, {
          entity: "products",
          sessionId: sessionRef.current ?? undefined,
        });
        sessionRef.current = result.sessionId;
        onSessionChange(result.sessionId);
        onChange([...images, result.url]);
      } catch {
        toast.error(`Couldn't upload ${file.name}.`);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const fromIndex = images.indexOf(String(active.id));
    const toIndex = images.indexOf(String(over.id));
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    if (!moved) {
      return;
    }
    reordered.splice(toIndex, 0, moved);
    onChange(reordered);
  }

  async function handleRemove(url: string) {
    if (url.includes(TMP_URL_MARKER)) {
      // Still a draft sitting in the session's tmp prefix — nothing
      // persisted yet, so a plain local-state removal is enough.
      onChange(images.filter((image) => image !== url));
      return;
    }

    setRetiringUrls((prev) => new Set(prev).add(url));
    try {
      await retireImage(url);
      onChange(images.filter((image) => image !== url));
    } catch {
      toast.error("Couldn't remove that image. Try again.");
    } finally {
      setRetiringUrls((prev) => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  }

  function handleMakePrimary(url: string) {
    onChange([url, ...images.filter((image) => image !== url)]);
  }

  return (
    <div className="flex flex-col gap-4" data-testid="admin-product-gallery">
      {images.length === 0 ? (
        <Empty data-testid="admin-product-gallery-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImagePlus />
            </EmptyMedia>
            <EmptyTitle>No images yet</EmptyTitle>
            <EmptyDescription>
              Upload product photos — the first one is the storefront cover.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext items={images} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {images.map((url, index) => (
                <SortableImageCard
                  isPrimary={index === 0}
                  isRetiring={retiringUrls.has(url)}
                  key={url}
                  onMakePrimary={() => handleMakePrimary(url)}
                  onRemove={() => handleRemove(url)}
                  url={url}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div>
        <input
          accept="image/*"
          className="hidden"
          multiple
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
          ref={fileInputRef}
          type="file"
        />
        <Button
          data-testid="admin-product-gallery-upload"
          disabled={status === "uploading"}
          onClick={() => fileInputRef.current?.click()}
          type="button"
          variant="outline"
        >
          {status === "uploading" ? (
            <>
              <Spinner data-icon /> Uploading…
            </>
          ) : (
            <>
              <ImagePlus data-icon /> Add images
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function SortableImageCard({
  url,
  isPrimary,
  isRetiring,
  onMakePrimary,
  onRemove,
}: {
  url: string;
  isPrimary: boolean;
  isRetiring: boolean;
  onMakePrimary: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      className="group relative aspect-square overflow-hidden rounded-2xl border border-border/50"
      ref={setNodeRef}
      style={{
        ...style,
        zIndex: isDragging ? 20 : undefined,
        opacity: isDragging ? 0.6 : undefined,
      }}
    >
      <img
        alt="Product"
        className={cn("size-full object-cover", isRetiring && "opacity-50")}
        loading="lazy"
        src={url}
      />

      {isRetiring ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <Spinner />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-2">
        <button
          className="pointer-events-auto flex cursor-grab items-center justify-center rounded-full border border-white/40 bg-white/70 p-1.5 shadow-sm backdrop-blur-md active:cursor-grabbing"
          data-testid={`admin-product-gallery-drag-${url}`}
          disabled={isRetiring}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-3" />
        </button>

        <button
          className="pointer-events-auto flex items-center justify-center rounded-full border border-white/40 bg-white/70 p-1.5 shadow-sm backdrop-blur-md hover:bg-destructive hover:text-destructive-foreground disabled:pointer-events-none disabled:opacity-50"
          data-testid={`admin-product-gallery-remove-${url}`}
          disabled={isRetiring}
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-3" />
        </button>
      </div>

      <button
        className={cn(
          "pointer-events-auto absolute bottom-2 left-2 flex items-center gap-1 rounded-full border border-white/40 bg-white/70 px-2 py-1 font-semibold text-[10px] shadow-sm backdrop-blur-md",
          isPrimary
            ? "bg-primary text-primary-foreground"
            : "opacity-0 transition-opacity group-hover:opacity-100",
        )}
        data-testid={`admin-product-gallery-primary-${url}`}
        onClick={onMakePrimary}
        type="button"
      >
        <Star aria-hidden="true" className="size-3" />
        {isPrimary ? "Cover" : "Make cover"}
      </button>
    </Card>
  );
}

export default ProductImageGallery;
