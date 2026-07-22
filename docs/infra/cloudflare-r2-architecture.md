# Cloudflare R2 Storage — Architecture for Mumzo

> **Decisions locked:**
> - CDN domain: `r2.dev` default URL for now — swap via `R2_PUBLIC_URL` env var later
> - Server converts all images to **WebP** before upload (binary flows through Hono → Sharp → R2)
> - If processed file > `R2_RESIZE_THRESHOLD_MB` (default 1 MB, configurable) → also serve via
>   Cloudflare Image Resizing Worker at CDN time (no second upload)
> - Draft uploads use `mumzo/tmp/{sessionId}/` prefix; finalized when form submits
> - Keys follow `mumzo/{app}/{entity}/{id}/{slot}.webp` — app = `platform | admin | private`

---

## Bucket Strategy — Two Buckets

| Bucket | Name | Access | Purpose |
|--------|------|--------|---------|
| Public CDN | `mumzo-public` | Public (R2 managed public access) | Product images, category images, brand logos, review photos, avatars |
| Private | `mumzo-private` | Private (presigned GET only) | Invoice PDFs, order CSV exports |

> [!IMPORTANT]
> **`mumzo-private` has no public binding.** Every read requires a short-lived
> presigned GET URL generated server-side behind an auth check.

### CDN URL

For now, `R2_PUBLIC_URL` points to the auto-generated R2 public URL:
```
https://pub-<hash>.r2.dev
```
When `images.mumzo.in` is ready, it's a one-line env change — no DB migration,
no code change — because all stored keys are **relative paths**.

---

## Key Naming Convention

All keys follow a **three-level prefix hierarchy**:

```
mumzo/{app}/{entity}/{id}/{slot}.{ext}
```

| Segment | Values | Purpose |
|---------|--------|---------|
| `mumzo` | fixed | top-level namespace — isolates Mumzo from other projects sharing the bucket |
| `{app}` | `platform` · `admin` · `private` · `tmp` | who/what owns it |
| `{entity}` | `products` · `categories` · `brands` · `users` · `reviews` · `invoices` | domain entity |
| `{id}` | productId, slug, userId, … | specific record |
| `{slot}` | `main` · `gallery-0` · `cover` · `logo` · `avatar` · `photo-0` | image role |

### Full examples

```
# Public bucket (mumzo-public)
mumzo/platform/products/{productId}/main.webp
mumzo/platform/products/{productId}/gallery-0.webp
mumzo/platform/products/{productId}/gallery-1.webp
mumzo/platform/categories/{slug}/cover.webp
mumzo/platform/categories/{slug}/icon.webp
mumzo/platform/brands/{slug}/logo.webp
mumzo/platform/users/{userId}/avatar.webp
mumzo/platform/reviews/{reviewId}/photo-0.webp

# Admin-uploaded assets (still public bucket, admin prefix)
mumzo/admin/products/{productId}/main.webp      # admin overrides same entity

# Draft uploads (auto-cleaned after 24h via R2 lifecycle rule)
mumzo/tmp/{sessionId}/main.webp
mumzo/tmp/{sessionId}/gallery-0.webp

# Private bucket (mumzo-private)
mumzo/private/invoices/{orderId}/invoice.pdf
mumzo/private/exports/{exportId}/orders.csv
```

Rules:
- All key segments are **lowercase kebab-case**.
- Extension is always `.webp` (Sharp converts at upload time); PDFs/CSVs keep their ext.
- Overwriting the same slot key replaces the object in R2 — no orphans for
  "replace main image" flows.
- `mumzo/tmp/` objects are cleaned up on finalize or by a 24-hour R2 lifecycle rule.
- The `mumzo/` root prefix makes it trivial to grant scoped IAM/token access and
  add future projects to the same bucket without key collisions.

---

## Upload Flow — Server-Side Processing → R2 PutObject

Since the server converts to WebP, binary **does** flow through Hono. The
client sends a multipart upload; Hono processes and pushes to R2 directly.

```
Client                  Hono Server (Sharp + @aws-sdk)       R2
  │                            │                              │
  │  POST /api/v1/uploads      │                              │
  │  multipart: file, slot,    │                              │
  │  sessionId?                │                              │
  │ ─────────────────────────►│                              │
  │                            │  1. decode → resize (max dims)
  │                            │  2. convert to WebP          │
  │                            │  3. check size vs threshold  │
  │                            │     if > R2_RESIZE_THRESHOLD_MB:
  │                            │       set resizeable=true    │
  │                            │  4. PutObject(key, webpBytes)│
  │                            │ ────────────────────────────►│
  │                            │◄──────────────────── ETag    │
  │◄───────────────────────────│                              │
  │  { key, url, sessionId,    │                              │
  │    resizeable, sizeBytes } │                              │
```

### Why server-side (not presigned PUT)?

Presigned PUT was optimal when clients could upload directly. Since we want:
1. **Format enforcement** — all assets are WebP regardless of what the user picks
2. **Controlled dimensions** — max 2048px on the long edge, no giant RAW images
3. **Size normalization** — guarantee the stored object is clean

…the binary *must* go through Hono. The trade-off is acceptable: Bun handles
multipart streams efficiently, and image processing with Sharp is native-speed.

---

## Image Processing Pipeline (Sharp)

```ts
// Runs inside the upload handler before PutObject
import sharp from "sharp";

async function processImage(
  buffer: Buffer,
  opts: { maxDimension?: number; quality?: number }
): Promise<{ data: Buffer; info: sharp.OutputInfo }> {
  return sharp(buffer)
    .rotate()                             // respect EXIF orientation
    .resize({
      width: opts.maxDimension ?? 2048,
      height: opts.maxDimension ?? 2048,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: opts.quality ?? 82 })
    .toBuffer({ resolveWithObject: true });
}
```

### Threshold + Cloudflare Image Resizing

| Condition | Action |
|-----------|--------|
| Processed WebP ≤ `R2_RESIZE_THRESHOLD_MB` | Stored as-is; served at original size |
| Processed WebP > `R2_RESIZE_THRESHOLD_MB` | Stored as-is; `resizeable: true` flag in DB + API response |

When `resizeable: true`, the frontend appends resize params to the CDN URL:
```
https://pub-<hash>.r2.dev/mumzo/platform/products/abc/main.webp?w=400&q=75
```
This works via the **Cloudflare Image Resizing** Worker mounted on the bucket's
public URL (enabled at the Cloudflare dashboard level — no deploy needed).
The Worker is optional; without it the original WebP is served. Controlled by:
```env
R2_RESIZE_THRESHOLD_MB=1          # files above this get resizeable=true
R2_ENABLE_CDN_RESIZE=true         # feature flag — disable if Worker not set up
```

---

## Draft Upload Flow

Product/category forms upload images **async in the background while the user
fills the form**. Images land in `mumzo/tmp/{sessionId}/` and are moved to their
final path on form submit.

```
                           Form Open
                               │
User selects image ──────────► │  POST /api/v1/uploads
                               │  { file, slot: "main", sessionId: "sess_xyz" }
                               │  → stores at mumzo/tmp/sess_xyz/main.webp
                               │  → returns { key, url } immediately
                               ↓
                         User fills form
                         (multiple images
                          upload async,
                          each gets a key)
                               │
User submits form ───────────► │  POST /api/v1/admin/products    (create)
                               │  { name, ..., uploadSessionId: "sess_xyz" }
                               │  → server creates product row, gets productId
                               │  → CopyObject each mumzo/tmp/sess_xyz/*.webp
                               │       → mumzo/admin/products/{productId}/{slot}.webp
                               │  → DeleteObjects mumzo/tmp/sess_xyz/*
                               │  → inserts media_files rows
                               │  → returns product with image URLs
```

### Session lifecycle

| Event | Action |
|-------|--------|
| `POST /api/v1/uploads` | Creates/reuses session; uploads `mumzo/tmp/{sessionId}/{slot}.webp` |
| `POST /api/v1/uploads/replace` | Overwrites a slot (same session or live entity) |
| `DELETE /api/v1/uploads/sessions/{sessionId}` | Discards the session; `DeleteObjects mumzo/tmp/{sessionId}/*` |
| Form submit (product/category create) | Triggers finalize inline — no separate API call |
| Form submit (product update) | Same, but target is `mumzo/admin/products/{existingId}/{slot}.webp` |
| 24h R2 Lifecycle rule on `mumzo/tmp/*` | Auto-cleans abandoned sessions |

### Upload session DB table

```ts
// packages/db/src/schema/media.ts
export const uploadSessions = pgTable("upload_sessions", {
  id: text("id").primaryKey().$defaultFn(() => generateId("sess")),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),   // now() + 24h
  finalized: boolean("finalized").default(false).notNull(),
});
```

---

## `packages/storage` — Shared Package

```
packages/storage/
  src/
    client.ts          # S3Client singleton (R2 endpoint)
    upload.ts          # putObject(key, buffer, contentType) → ETag
    delete.ts          # deleteObject(key) | deleteObjects(keys[])
    copy.ts            # copyObject(srcKey, destKey)
    url.ts             # toPublicUrl(key, opts?) → string
    key-builder.ts     # buildKey / buildTmpKey
    types.ts           # UploadEntity, ProcessedImage, ...
    index.ts           # barrel
  package.json         # name: "@mumzo/storage"
  tsconfig.json
```

### `upload.ts`

```ts
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "./client";
import { env } from "@mumzo/env/server";

export async function putObject(
  bucket: "public" | "private",
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const Bucket = bucket === "public" ? env.R2_PUBLIC_BUCKET : env.R2_PRIVATE_BUCKET;
  const cmd = new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType });
  const result = await r2.send(cmd);
  return result.ETag ?? "";
}
```

### `url.ts`

```ts
import { env } from "@mumzo/env/server";

export function toPublicUrl(
  key: string,
  resize?: { w: number; q?: number },
): string {
  const base = `${env.R2_PUBLIC_URL}/${key}`;
  if (!resize || !env.R2_ENABLE_CDN_RESIZE) return base;
  const params = new URLSearchParams({ w: String(resize.w) });
  if (resize.q) params.set("q", String(resize.q));
  return `${base}?${params}`;
}
```

### `key-builder.ts`

```ts
export type StorageApp = "platform" | "admin" | "private";

export type UploadEntity =
  | "products" | "categories" | "brands"
  | "users" | "reviews" | "invoices" | "exports";

const ROOT = "mumzo" as const;

/**
 * Build a public-bucket object key.
 * e.g. buildKey("admin", "products", "prod_abc", "gallery-0")
 *   → "mumzo/admin/products/prod_abc/gallery-0.webp"
 */
export function buildKey(
  app: StorageApp,
  entity: UploadEntity,
  id: string,
  slot: string,
): string {
  return `${ROOT}/${app}/${entity}/${id}/${slot}.webp`;
}

/**
 * Draft upload key (auto-cleaned by lifecycle rule after 24h).
 * e.g. buildTmpKey("sess_xyz", "main")
 *   → "mumzo/tmp/sess_xyz/main.webp"
 */
export function buildTmpKey(sessionId: string, slot: string): string {
  return `${ROOT}/tmp/${sessionId}/${slot}.webp`;
}

/**
 * Private-bucket key for generated documents.
 * e.g. buildPrivateKey("invoices", "ord_abc")
 *   → "mumzo/private/invoices/ord_abc/invoice.pdf"
 */
export function buildPrivateKey(
  entity: "invoices" | "exports",
  id: string,
  filename: string,
): string {
  return `${ROOT}/private/${entity}/${id}/${filename}`;
}

/** Extract the prefix used for lifecycle rules / bulk operations. */
export const KEY_PREFIXES = {
  tmp: `${ROOT}/tmp/`,
  platform: `${ROOT}/platform/`,
  admin: `${ROOT}/admin/`,
  private: `${ROOT}/private/`,
} as const;
```

---

## API Endpoints — `apps/server`

### Upload module: `src/modules/platform/v1/uploads/`

```
uploads/
  index.ts          # Hono router
  schema.ts         # Zod: UploadRequest, ReplaceRequest, FinalizeRequest
  service.ts        # processImage (Sharp) + putObject + DB session
  processor.ts      # Sharp pipeline — separated for testability
```

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/uploads` | session | Process + store to `tmp/`; returns `{ key, url, sessionId }` |
| `PUT` | `/api/v1/uploads/{sessionId}/{slot}` | session | Replace a specific slot in a session |
| `DELETE` | `/api/v1/uploads/sessions/{sessionId}` | session | Discard session + delete `tmp/` objects |

Finalize is **not** a standalone endpoint — it's called internally by product/category
create/update handlers when they consume `uploadSessionId` from the form body.

### Admin upload: `src/modules/admin/v1/uploads/`

Same, but also allows uploading against a **live entity** (e.g. replace a
product image without a draft session):

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/admin/uploads` | admin | Upload + store directly to final path |
| `DELETE` | `/api/v1/admin/uploads/{key}` | admin | Delete object from R2 + media_files |

---

## DB Schema Additions — `packages/db/src/schema/media.ts`

```ts
import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { generateId } from "@mumzo/db/utils";
import { user } from "./auth";

export const uploadSessions = pgTable("upload_sessions", {
  id: text("id").primaryKey().$defaultFn(() => generateId("sess")),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  finalized: boolean("finalized").default(false).notNull(),
});

export const mediaFiles = pgTable(
  "media_files",
  {
    id: text("id").primaryKey().$defaultFn(() => generateId("mf")),
    entity: text("entity").notNull(),      // "products" | "reviews" | ...
    entityId: text("entity_id").notNull(),
    slot: text("slot").notNull(),          // "main" | "gallery-0" | "photo-0"
    key: text("key").notNull().unique(),   // R2 object key (relative)
    contentType: text("content_type").notNull().default("image/webp"),
    sizeBytes: integer("size_bytes"),
    resizeable: boolean("resizeable").default(false).notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("media_files_entity_idx").on(t.entity, t.entityId)],
);
```

Single-image entities (category cover, brand logo, user avatar) store the key
**directly on their own row** — no join needed:
```ts
// e.g. on the users table
avatarKey: text("avatar_key"),   // "mumzo/platform/users/abc/avatar.webp"
```

---

## `@mumzo/env` Additions

### `packages/env/src/server.ts`

```ts
// Cloudflare R2
R2_ENDPOINT: z.url(),
R2_ACCESS_KEY_ID: z.string().min(1),
R2_SECRET_ACCESS_KEY: z.string().min(1),
R2_PUBLIC_BUCKET: z.string().default("mumzo-public"),
R2_PRIVATE_BUCKET: z.string().default("mumzo-private"),
R2_PUBLIC_URL: z.url(),                        // https://pub-<hash>.r2.dev (for now)

// Upload processing
R2_MAX_UPLOAD_MB: z
  .coerce.number().positive().default(20),       // reject anything larger than this
R2_RESIZE_THRESHOLD_MB: z
  .coerce.number().positive().default(1),        // above this → resizeable=true
R2_ENABLE_CDN_RESIZE: z
  .enum(["true", "false"]).default("false")
  .transform((v) => v === "true"),               // enable once Worker is set up
R2_IMAGE_MAX_DIMENSION: z
  .coerce.number().positive().default(2048),     // max long-edge in px
R2_IMAGE_QUALITY: z
  .coerce.number().min(1).max(100).default(82),  // WebP quality
```

### `.env.example` additions

```env
# --- Cloudflare R2 ----------------------------------------------------------
# Account ID is in Cloudflare dashboard → R2 → Overview
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_BUCKET=mumzo-public
R2_PRIVATE_BUCKET=mumzo-private
# Use the r2.dev URL from the bucket's Public Access settings page
R2_PUBLIC_URL=https://pub-<HASH>.r2.dev

# --- Upload processing -------------------------------------------------------
R2_MAX_UPLOAD_MB=20
R2_RESIZE_THRESHOLD_MB=1
R2_ENABLE_CDN_RESIZE=false       # flip to true once Image Resizing Worker is live
R2_IMAGE_MAX_DIMENSION=2048
R2_IMAGE_QUALITY=82
```

---

## Integration with Existing API Endpoints

| Existing endpoint | Change |
|-------------------|---------|
| `POST /api/v1/admin/products` | Accept `uploadSessionId`; finalize `mumzo/tmp/` → `mumzo/admin/products/{id}/` inline |
| `PATCH /api/v1/admin/products/:id` | Accept `uploadSessionId` or direct `imageKey` replacements |
| `DELETE /api/v1/admin/products/:id/images/:imgId` | `deleteObject(key)` + delete `media_files` row |
| `POST /api/v1/admin/categories` | Accept `uploadSessionId`; finalize to `mumzo/admin/categories/{slug}/` |
| `POST /api/v1/admin/brands` | Accept `uploadSessionId`; finalize to `mumzo/admin/brands/{slug}/logo.webp` |
| `PATCH /api/v1/users/me/avatar` | `POST /api/v1/uploads` → `{ key }` → update `user.avatarKey` (`mumzo/platform/users/{id}/avatar.webp`) |
| `POST /api/v1/products/:id/reviews` | `images?` = array of `mumzo/tmp/` keys from prior uploads → finalize to `mumzo/platform/reviews/{id}/photo-N.webp` |
| `GET /api/v1/orders/:id/invoice` | Generate PDF → `putObject("mumzo/private/invoices/{id}/invoice.pdf")` → return presigned GET URL |

---

## Security Model

| Threat | Mitigation |
|--------|-----------|
| Unauthenticated upload | All upload endpoints require Better Auth session |
| Client-controlled path | Server builds the key from `entity + id + slot`; client only sends intent |
| Oversized file | `R2_MAX_UPLOAD_MB` enforced in Hono middleware before Sharp even runs |
| Malicious file type | Sharp will throw if the buffer isn't a valid image; content-type checked |
| Accessing another user's session | `uploadSessions.userId` checked against current session user |
| Public access to invoices | `mumzo-private` has no public binding; presigned GET with 5-min TTL |
| Abandoned `tmp/` objects | 24-hour R2 object lifecycle rule on `mumzo/tmp/*` prefix |
| Stale CDN after delete | Cloudflare Cache Purge API call on `deleteObject` (Phase 3) |

---

## Phased Implementation

### Phase 1 — Foundation *(implement next)*
- [ ] Create `packages/storage` (`client`, `upload`, `copy`, `delete`, `url`, `key-builder`, `types`)
- [ ] Add R2 env vars to `packages/env/src/server.ts` + `.env.example`
- [ ] Create `media.ts` Drizzle schema (`upload_sessions`, `media_files`) + migration
- [ ] Upload handler with Sharp pipeline: `POST /api/v1/uploads`
- [ ] Session finalize utility (internal — called by product/category handlers)
- [ ] Session discard: `DELETE /api/v1/uploads/sessions/{sessionId}`
- [ ] Wire to `POST /api/v1/admin/products` + `PATCH :id`
- [ ] Wire to `PATCH /api/v1/users/me/avatar`

### Phase 2 — Complete coverage
- [ ] Wire to category + brand image upload (admin)
- [ ] Wire to review photo upload (platform) with multi-slot session
- [ ] Invoice PDF → `mumzo-private` → presigned GET on order invoice endpoint
- [ ] Admin: direct replace (live entity, no session)

### Phase 3 — Optimization
- [ ] Set up Cloudflare Image Resizing Worker → flip `R2_ENABLE_CDN_RESIZE=true`
- [ ] Cache purge on `deleteObject` (Cloudflare Cache Purge API)
- [ ] R2 lifecycle rule for `tmp/*` (set in Cloudflare dashboard)
- [ ] Metrics: track upload latency + failure rate via Hono middleware
