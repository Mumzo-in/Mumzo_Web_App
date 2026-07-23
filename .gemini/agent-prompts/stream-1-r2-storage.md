# Stream 1 Agent Prompt: R2 Storage & Upload Pipeline

## 🎯 Objective
Build the Cloudflare R2 image upload pipeline: `@mumzo/storage` SDK, server upload endpoints with Sharp WebP processing, and the shared frontend `useImageSlotUpload` hook.

## 📁 Target Files
- `packages/db/src/schema/media.ts` (NEW — `uploadSessions` table)
- `packages/db/src/schema/index.ts`
- `packages/storage/*` (NEW package)
- `packages/env/src/server.ts`
- `.env.example`
- `packages/auth/src/permissions.ts`
- `apps/server/src/modules/admin/v1/uploads/*` (NEW module)
- `apps/server/src/modules/admin/v1/routes.ts`
- `apps/admin/src/core/api/client.ts`
- `apps/admin/src/core/api/use-image-slot-upload.ts` (NEW)

## 📝 Instructions
1. **DB Schema**: Add `uploadSessions` table to `packages/db/src/schema/media.ts` (`id` text PK, `userId` FK, `createdAt`, `expiresAt`, `finalized` boolean). Export from `schema/index.ts`.
2. **Storage SDK (`packages/storage`)**:
   - `client.ts`: S3Client singleton for Cloudflare R2.
   - `key-builder.ts`: `buildKey("platform"|"admin"|"private", entity, id, slot)`, `buildTmpKey(sessionId, slot)`, `buildPrivateKey(entity, id, filename)`, `KEY_PREFIXES`.
   - `upload.ts`, `copy.ts`, `delete.ts`: PutObject, CopyObject, DeleteObjects helpers.
   - `url.ts`: `toPublicUrl(key, resize?)`.
   - `processor.ts`: Sharp pipeline (rotate -> resize max 2048px -> WebP quality 82).
3. **Environment & Auth**:
   - Add R2 config keys (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BUCKET`, `R2_PRIVATE_BUCKET`, `R2_PUBLIC_URL`, `R2_MAX_UPLOAD_MB`, `R2_RESIZE_THRESHOLD_MB`, `R2_IMAGE_MAX_DIMENSION`, `R2_IMAGE_QUALITY`) to `packages/env/src/server.ts` and `.env.example`.
   - Add `upload: ["create", "delete"]` to `packages/auth/src/permissions.ts`.
4. **Hono Upload Router (`apps/server/src/modules/admin/v1/uploads/`)**:
   - Implement `POST /api/v1/admin/uploads` (multipart file -> Sharp WebP -> save to `mumzo/tmp/{sessionId}/{slot}.webp`).
   - Implement `DELETE /api/v1/admin/uploads/sessions/{sessionId}`.
   - Register in `modules/admin/v1/routes.ts`.
5. **Frontend Core Upload Hook**:
   - `apps/admin/src/core/api/client.ts`: Add `apiUpload<T>(path, formData)`.
   - `apps/admin/src/core/api/use-image-slot-upload.ts`: Create React hook managing slot states (`idle | uploading | uploaded | error`), progress, and retry.

## ⚡ Verification
- `cd packages/storage && bunx tsc --noEmit`
- `cd apps/server && bunx tsc --noEmit`
- `cd apps/admin && bunx tsc --noEmit`
- `bunx biome check packages/storage apps/server/src/modules/admin/v1/uploads`
