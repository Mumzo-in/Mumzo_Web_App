# Mumzo Form Layout Specification

This document defines the design guidelines, components, and implementation rules for **complex, multi-section forms** (e.g. Product Create/Edit) within the Mumzo Admin Panel.

---

## 📐 1. The Core Grid Structure

To handle dense form sets without overwhelming the user, use a side-by-side **Sidebar Nav + Active Section Form** grid layout.

```
+-----------------------------------------------------------+
| Page Header (Product Title)                               |
+------------------------------+----------------------------+
| [Section 1: Basic Info]  (✓) |  +-----------------------+ |
| [Section 2: Pricing & Stock] |  | Card Container        | |
| [Section 3: Variants]    (⚠️) |  |                       | |
| [Section 4: Cross-Sells]     |  | Active Form Fields... | |
|                              |  |                       | |
|                              |  +-----------------------+ |
+------------------------------+----------------------------+
| Sticky Actions Footer (Cancel / Save Changes)             |
+-----------------------------------------------------------+
```

### Layout Markup (Tailwind v4)
```tsx
<div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
  {/* Sticky Navigation Sidebar */}
  <aside className="lg:sticky lg:top-6 flex flex-col gap-1 rounded-3xl border border-border bg-card p-2 shadow-warm">
    {/* Sidebar Section Buttons */}
  </aside>

  {/* Form Content Area */}
  <main className="flex flex-col gap-6">
    {/* Active Form Sections */}
  </main>
</div>
```

---

## 🧭 2. Sidebar Navigation Items

The sidebar lists form categories. Each tab must report validation health, active state, and completeness.

```tsx
interface FormSidebarTabProps {
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isComplete: boolean;
  hasErrors: boolean;
  onClick: () => void;
}

export function FormSidebarTab({
  label,
  description,
  icon: Icon,
  isActive,
  isComplete,
  hasErrors,
  onClick,
}: FormSidebarTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full rounded-2xl px-4 py-3 text-left transition-all ${
        isActive 
          ? "bg-secondary text-secondary-foreground font-semibold" 
          : "hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
      }`}
      type="button"
    >
      <div className="flex items-center gap-3">
        <Icon className={`size-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm leading-none">{label}</span>
          {description && <span className="text-[10px] opacity-70">{description}</span>}
        </div>
      </div>
      
      {/* Visual State Indicators */}
      <div className="flex items-center gap-1.5">
        {hasErrors && (
          <span className="size-2 rounded-full bg-destructive animate-pulse" aria-label="Errors present" />
        )}
        {isComplete && !hasErrors && (
          <span className="text-xs text-primary font-bold">✓</span>
        )}
      </div>
    </button>
  );
}
```

---

## 📝 3. Form Sections Mapping

A complex product edit page features the following categories:

| Section | Icon | Fields |
|---|---|---|
| **Basic Info** | `FileText` | Product Name, SKU, Brand, Category, Description, Tags |
| **Pricing & Stock** | `Banknote` | Price, MRP, Tax slab, Minimum stock warning limits |
| **Variants** | `Layers` | Sizes (e.g. 76 Wipes, Pack of 2), SKU variants, weight offsets |
| **Cross-Sells** | `Heart` | "You may also like" related product suggestions |
| **Media Assets** | `Image` | Cloudflare R2 gallery upload rail |

---

## 💾 4. Sticky Bottom Action Bar

Since forms can be long, submit controls must be **locked at the bottom of the viewport** so they are accessible from any tab without scrolling back to the top.

```tsx
export function FormActionsFooter({
  isSubmitting,
  isValid,
  onCancel,
  onSubmit,
}: {
  isSubmitting: boolean;
  isValid: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-50 -mx-6 -mb-6 mt-8 border-t border-border/40 bg-background/80 px-6 py-4 backdrop-blur-md flex items-center justify-between">
      <div className="text-xs text-muted-foreground">
        {!isValid && (
          <span className="text-destructive font-medium flex items-center gap-1.5">
            ⚠️ Please fix errors before saving
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Discard Changes
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting || !isValid}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
```

---

## 🧪 5. Validation & State Sync Best Practices

1. **Section Validation Mapping**:
   Map validation states directly to the form object (e.g. using `zod` schema sub-shapes). If `errors.name` exists, flag the "Basic Info" sidebar tab with `hasErrors = true`.
2. **Prevent Tab Blocking**:
   Do **not** block the user from switching tabs if a section is invalid. Let them freely click around the sidebar; simply prevent the final form submit and highlight tabs containing errors.
3. **Optimistic Dirty State**:
   Show a subtle warning badge ("Unsaved Changes") next to the main header title if `form.isDirty` is true.
