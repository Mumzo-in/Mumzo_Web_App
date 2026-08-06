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
import { Card } from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { Switch } from "@mumzo/ui/components/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { formatNumber } from "@/core/components/format";
import {
  type CategoryWithCount,
  reorderCategories,
  updateCategory,
} from "../api/categories-api";
import { categoriesQueryOptions } from "../queries/categories";

const SKELETONS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"] as const;

export function CategoryList() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(categoriesQueryOptions);

  const [localCategories, setLocalCategories] = useState<CategoryWithCount[]>(
    [],
  );

  useEffect(() => {
    if (data) {
      setLocalCategories(data);
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleToggleActive = async (slug: string, checked: boolean) => {
    const previous = localCategories;
    setLocalCategories((prev) =>
      prev.map((c) => (c.slug === slug ? { ...c, isActive: checked } : c)),
    );

    try {
      await updateCategory(slug, { isActive: checked });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.lists(),
      });
    } catch (error) {
      setLocalCategories(previous);
      toast.error(
        error instanceof Error ? error.message : "Could not update category.",
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const previous = localCategories;
    const fromIndex = previous.findIndex((c) => c.slug === active.id);
    const toIndex = previous.findIndex((c) => c.slug === over.id);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const reordered = [...previous];
    const [moved] = reordered.splice(fromIndex, 1);
    if (!moved) {
      return;
    }
    reordered.splice(toIndex, 0, moved);

    setLocalCategories(reordered);

    try {
      await reorderCategories(reordered.map((c) => c.slug));
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.lists(),
      });
    } catch (error) {
      setLocalCategories(previous);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not reorder categories.",
      );
    }
  };

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {SKELETONS.map((key) => (
          <Skeleton key={key} className="aspect-[1/1.05] rounded-2xl" />
        ))}
      </div>
    );
  }

  const categoriesToRender =
    localCategories.length > 0 ? localCategories : data;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={categoriesToRender.map((c) => c.slug)}
        strategy={rectSortingStrategy}
      >
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          data-testid="admin-category-list"
        >
          {categoriesToRender.map((category) => (
            <SortableCategoryCard
              category={category}
              key={category.slug}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCategoryCard({
  category,
  onToggleActive,
}: {
  category: CategoryWithCount;
  onToggleActive: (slug: string, checked: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      className="group relative aspect-[1/1.05] overflow-hidden rounded-2xl border border-border/50 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(31,27,58,0.10)]"
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: category.color || "#F6F3EC",
        zIndex: isDragging ? 20 : undefined,
        opacity: isDragging ? 0.6 : undefined,
      }}
    >
      {/* Floating Admin Controls Header (Drag Handle Left, Active Toggle Right) */}
      <div className="pointer-events-auto absolute top-3 right-3 left-3 z-10 flex items-center justify-between">
        {/* Drag Handle (Top-Left) */}
        <button
          className="flex cursor-grab items-center justify-center rounded-full border border-white/40 bg-white/70 p-1.5 shadow-sm backdrop-blur-md transition-all hover:bg-white/90 active:cursor-grabbing"
          data-testid={`admin-category-drag-${category.slug}`}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical
            className="size-3 text-muted-foreground"
            aria-hidden="true"
          />
        </button>

        {/* Active Toggle (Top-Right) */}
        <div className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/70 px-2 py-0.5 shadow-sm backdrop-blur-md transition-all">
          <Switch
            checked={category.isActive}
            onCheckedChange={(checked) =>
              onToggleActive(category.slug, checked)
            }
          />
          <span className="pr-1 font-extrabold text-[8px] text-foreground/75 tracking-wider">
            {category.isActive ? "ON" : "OFF"}
          </span>
        </div>
      </div>

      {/* Storefront Image (Exact 1:1 platform size & placement) */}
      {category.img ? (
        <img
          src={category.img}
          alt={category.name}
          loading="lazy"
          className="absolute right-[-8%] bottom-[-6%] h-[62%] w-[70%] rounded-2xl object-cover shadow-md transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute right-[-8%] bottom-[-6%] flex h-[62%] w-[70%] items-center justify-center rounded-2xl border border-white/20 bg-white/35 shadow-inner">
          <span className="select-none text-3xl opacity-20 grayscale filter">
            👶
          </span>
        </div>
      )}

      {/* Storefront Text & Admin Info Layout */}
      <div className="pointer-events-none relative flex h-full flex-col justify-between p-4">
        <div className="mt-8">
          {" "}
          {/* Added margin-top to clear the floating top header */}
          <p className="font-semibold text-[10px] text-foreground/60 uppercase tracking-widest">
            Shelf
          </p>
          <p className="mt-1 max-w-[70%] font-bold font-serif text-foreground text-lg leading-tight">
            {category.name}
          </p>
          <p className="mt-1 line-clamp-2 max-w-[65%] text-[11px] text-foreground/55 leading-relaxed">
            {category.tagline}
          </p>
        </div>

        {/* Bottom-left Admin Stats */}
        <div className="pointer-events-auto mt-auto flex flex-col items-start gap-1.5">
          <span className="numeric rounded-full border border-white/30 bg-white/50 px-2 py-0.5 font-bold text-[9px] text-foreground/80 shadow-sm backdrop-blur-md">
            {formatNumber(category.productCount)} products
          </span>
          <Link
            to="/catalog/categories/$slug"
            params={{ slug: category.slug }}
            className="font-extrabold text-[10px] text-primary hover:underline"
            data-testid={`admin-category-${category.slug}`}
          >
            Edit Details
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default CategoryList;
