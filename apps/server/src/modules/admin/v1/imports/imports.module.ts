import type { z } from "@hono/zod-openapi";
import { env } from "@mumzo/env/server";
import { bodyLimit } from "hono/body-limit";
import { createRouter, requirePermission } from "@/core";
import { badRequest, unauthorized } from "@/core/errors";
import {
  getJobErrorsRoute,
  getJobRoute,
  resolveJobRoute,
  runJobRoute,
  uploadRouteDef,
  validateJobRoute,
} from "./imports.routes";
import type { importJobStatusSchema } from "./imports.schema";
import {
  getJob,
  getJobErrors,
  resolveJob,
  runJob,
  uploadImportFile,
  validateJob,
} from "./imports.service";

/**
 * Bulk product import — upload a CSV/XLSX → confirm column mapping →
 * validate/resolve missing brand/category links → chunked import. `POST /`
 * is `multipart/form-data`, parsed by hand like `uploads.module.ts` (see the
 * note there — `createRoute` can't validate multipart bodies directly).
 */

type JobRow = {
  id: string;
  status: string;
  fileName: string;
  columnMapping: unknown;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
};

/** DB `status`/`columnMapping` are untyped `text`/`jsonb` columns — this is
 * the one place a stored job row is cast into the route's typed wire shape. */
function serializeJob(job: JobRow) {
  return {
    id: job.id,
    entity: "product" as const,
    status: job.status as z.infer<typeof importJobStatusSchema>,
    fileName: job.fileName,
    columnMapping: (job.columnMapping as Record<string, string> | null) ?? null,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    successCount: job.successCount,
    failureCount: job.failureCount,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

const app = createRouter();

app.use("/*", requirePermission("import", "read"));
app.post("/", requirePermission("import", "create"));
app.post("/:id/validate", requirePermission("import", "create"));
app.post("/:id/resolve", requirePermission("import", "create"));
app.post("/:id/run", requirePermission("import", "create"));

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

const imports = app
  .openapi(uploadRouteDef, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }

    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
      throw badRequest("A `file` field is required.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImportFile({
      file: buffer,
      fileName: file.name,
      userId: user.id,
    });

    return c.json(
      {
        success: true as const,
        data: {
          job: serializeJob(result.job),
          headers: result.headers,
          suggestedMapping: result.suggestedMapping,
          sampleRows: result.sampleRows,
        },
      },
      201,
    );
  })
  .openapi(getJobRoute, async (c) => {
    const job = await getJob(c.req.valid("param").id);
    return c.json({ success: true as const, data: serializeJob(job) }, 200);
  })
  .openapi(validateJobRoute, async (c) => {
    const result = await validateJob(
      c.req.valid("param").id,
      c.req.valid("json").columnMapping,
    );
    return c.json(
      {
        success: true as const,
        data: { ...result, job: serializeJob(result.job) },
      },
      200,
    );
  })
  .openapi(resolveJobRoute, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }
    const result = await resolveJob(
      c.req.valid("param").id,
      user.id,
      c.req.valid("json"),
    );
    return c.json(
      {
        success: true as const,
        data: { ...result, job: serializeJob(result.job) },
      },
      200,
    );
  })
  .openapi(runJobRoute, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }
    const job = await runJob(c.req.valid("param").id, user.id);
    return c.json(
      { success: true as const, data: { job: serializeJob(job) } },
      200,
    );
  })
  .openapi(getJobErrorsRoute, async (c) => {
    const errors = await getJobErrors(c.req.valid("param").id);
    return c.json(
      {
        success: true as const,
        data: errors.map((e) => ({
          rowNumber: e.rowNumber,
          productKey: e.productKey,
          message: e.message,
        })),
      },
      200,
    );
  });

export default imports;
