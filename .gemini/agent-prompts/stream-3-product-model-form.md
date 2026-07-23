# Stream 3 Agent Prompt: Product Data Model & Product Form Redesign

## 🎯 Objective
Implement `product_vendor` sourcing table, 4-state product status, redesign the admin product form with Sourcing and Media tabs, and wire product session finalization.

## 📁 Target Files
- `packages/db/src/schema/catalog.ts` (add `product_vendor`, drop `product.vendorId` & `costPrice`)
- `packages/schema/src/product.ts` (export `ProductStatus`)
- `apps/server/src/modules/admin/v1/products/*`
- `apps/server/src/modules/platform/v1/products/*`
- `apps/admin/src/modules/operations/products/components/product-form.tsx`
- `apps/admin/src/modules/operations/products/components/product-image-gallery.tsx` (NEW)
- `apps/admin/src/pages/(admin)/catalog/products/$productId/images.tsx`
- `apps/admin/src/modules/operations/products/api/products-api.ts`

## 📝 Instructions
1. **DB Schema & Migration**:
   - `packages/db/src/schema/catalog.ts`: Add `productVendor` table (`productId` PK/FK unique, `vendorId` FK, `relationship` text, `costPrice` int, `leadTimeDays` int, `notes` text, timestamps).
   - Drop `product.vendorId` and `product.costPrice` columns from `product` table.
   - Run `bun db:generate` and ensure the backfill INSERT runs BEFORE dropping old columns.
2. **Canonical Enums**:
   - Export `ProductStatus` enum (`draft | active | inactive | archived`) from `@mumzo/schema/src/product.ts`.
3. **Server Products Modules**:
   - `modules/admin/v1/products/`: Update write schema for nested `vendor` object (`{ vendorId, relationship, costPrice?, leadTimeDays?, notes? } | null`). Update `products.repo.ts` to `leftJoin(productVendor)` and upsert/delete the link row inside the DB transaction. Update `products.service.ts` serializer.
   - `products.service.ts`: Consume `uploadSessionId` on create/update to move draft `mumzo/tmp/{sessionId}/*` images to `mumzo/admin/products/{productId}/{slot}.webp` and write to `product.images`.
   - `modules/platform/v1/products/`: Ensure storefront query strictly filters `status = 'active'`.
4. **Product Form Redesign (`product-form.tsx`)**:
   - Clean up dead code & replace hardcoded status literals with `ProductStatus`.
   - **Sourcing Tab**: Add new sidebar tab with vendor picker. Selecting "None (self-stocked)" sets `vendor: null`. Selecting a vendor opens relationship (`own|retainer|distributor`), cost price, lead time, and notes fields.
   - Move `costPrice` from Pricing section to Sourcing section.
   - **Status Control**: Add Publish button and Active/Inactive toggle switch.
   - **Media Tab**: Build `product-image-gallery.tsx` for multi-image upload & reorder using `useImageSlotUpload`.
   - Wire `products/$productId/images.tsx` to the gallery component.

## ⚡ Verification
- `cd packages/db && bunx tsc --noEmit`
- `cd apps/server && bunx tsc --noEmit`
- `cd apps/admin && bunx tsc --noEmit`
- `bunx biome check apps/admin/src/modules/operations/products`
