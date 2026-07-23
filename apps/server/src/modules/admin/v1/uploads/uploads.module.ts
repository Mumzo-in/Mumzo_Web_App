import { env } from "@mumzo/env/server";
import { bodyLimit } from "hono/body-limit";
import { createRouter, requirePermission } from "@/core";
import { badRequest, unauthorized } from "@/core/errors";
import {
  discardSessionRoute,
  retireImageRoute,
  uploadRoute,
} from "./uploads.routes";
import { uploadFormSchema } from "./uploads.schema";
import { discardSession, handleUpload, retireImage } from "./uploads.service";

/**
 * Image uploads. `POST /` is a `multipart/form-data` body, which
 * `@hono/zod-openapi`'s `createRoute` can't validate directly — see the note
 * in `uploads.routes.ts`. The form is parsed and validated by hand here.
 */

const app = createRouter();

app.use("/*", requirePermission("upload", "create"));
app.delete("/sessions/:sessionId", requirePermission("upload", "delete"));
app.delete("/retire", requirePermission("upload", "delete"));

// Reject oversized bodies before Hono buffers the whole multipart payload.
app.use(
  "/*",
  bodyLimit({
    maxSize: env.R2_MAX_UPLOAD_MB * 1024 * 1024,
    onError: (c) =>
      c.json(
        {
          success: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: `File exceeds the ${env.R2_MAX_UPLOAD_MB}MB upload limit.`,
          },
        },
        413,
      ),
  }),
);

const uploads = app
  .openapi(uploadRoute, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }

    const body = await c.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      throw badRequest("A `file` field is required.");
    }

    const { entity, slot, sessionId } = uploadFormSchema.parse({
      entity: body.entity,
      slot: body.slot,
      sessionId: body.sessionId || undefined,
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await handleUpload({
      file: buffer,
      entity,
      slot,
      sessionId,
      userId: user.id,
    });

    return c.json({ success: true as const, data: result }, 201);
  })
  .openapi(discardSessionRoute, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }

    await discardSession(c.req.valid("param").sessionId, user.id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(retireImageRoute, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }

    await retireImage({ url: c.req.valid("json").url });
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default uploads;
