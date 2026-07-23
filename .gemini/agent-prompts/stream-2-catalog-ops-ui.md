# Stream 2 Agent Prompt: Brand, Category, Vendor & Inventory Operations

## 🎯 Objective
Clean up Vendor structure by removing `vendor.type`, build the Category create/edit form with cover upload, add Brand logo upload, and implement the Product Stock page.

## 📁 Target Files
- `packages/db/src/schema/catalog.ts` (remove `vendor.type`)
- `packages/schema/src/vendor.ts` (NEW — export `VendorRelationship`)
- `apps/server/src/modules/admin/v1/vendors/*`
- `apps/server/src/modules/admin/v1/brands/*`
- `apps/server/src/modules/admin/v1/categories/*`
- `apps/admin/src/modules/operations/categories/components/category-form.tsx` (NEW)
- `apps/admin/src/pages/(admin)/catalog/categories/new.tsx` & `$slug.tsx`
- `apps/admin/src/modules/operations/brands/components/brand-dialog.tsx`
- `apps/admin/src/modules/operations/vendors/components/vendor-form.tsx`
- `apps/admin/src/modules/operations/vendors/data/vendor-data.ts`
- `apps/admin/src/modules/operations/vendors/components/vendor-table.tsx`
- `apps/admin/src/pages/(admin)/catalog/vendors/$vendorId/index.tsx`
- `apps/admin/src/modules/operations/inventory/api/inventory-api.ts`
- `apps/admin/src/pages/(admin)/catalog/products/$productId/stock.tsx`

## 📝 Instructions
1. **Schema Cleanup & Export**:
   - Remove `vendor.type` column from `packages/db/src/schema/catalog.ts`.
   - Create `packages/schema/src/vendor.ts`: export `VendorRelationship` enum (`own | retainer | distributor`).
2. **Vendor Backend & UI Cleanup**:
   - `modules/admin/v1/vendors/`: Remove `type` from schemas/services/repos.
   - Admin Vendor UI (`vendor-form.tsx`, `vendor-data.ts`, `vendor-table.tsx`, `vendors/$vendorId/index.tsx`): Remove `type` dropdowns, constants, and table badges.
3. **Category Form & Cover Upload**:
   - `modules/operations/categories/components/category-form.tsx`: Build category form (slug, name, tagline, color, isActive, hasSizes, brandIds) + cover upload using `useImageSlotUpload`.
   - Wire `categories/new.tsx` and `categories/$slug.tsx` to render `CategoryForm`.
   - Update `categories.service.ts`: Support `uploadSessionId` to copy `mumzo/tmp/` cover to final R2 destination on save.
4. **Brand Logo Upload Widget**:
   - `brand-dialog.tsx`: Replace plain URL text input with logo image upload widget.
   - Update `brands.service.ts`: Support `uploadSessionId` for brand logo finalize.
5. **Product Stock Management Page**:
   - `inventory-api.ts`: Add `listInventory` and `adjustInventory` functions.
   - `products/$productId/stock.tsx`: Replace `ComingSoon` with per-hub stock table + `<AdjustInventoryDialog />`.

## ⚡ Verification
- `cd apps/server && bunx tsc --noEmit`
- `cd apps/admin && bunx tsc --noEmit`
- `bunx biome check apps/admin/src/modules/operations/categories apps/admin/src/modules/operations/brands apps/admin/src/modules/operations/vendors`
