import { useCallback, useRef, useState } from "react";

import { ApiError, apiUpload } from "./client";

/** Response shape returned by `POST /api/v1/admin/uploads`. */
type UploadResponse = {
  key: string;
  url: string;
  sessionId: string;
  resizeable: boolean;
  sizeBytes: number;
};

type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

type UploadOpts = {
  entity:
    | "products"
    | "categories"
    | "brands"
    | "users"
    | "reviews"
    | "invoices"
    | "exports";
  sessionId?: string;
};

type UploadResult = { url: string; sessionId: string };

type UseImageSlotUploadResult = {
  status: UploadStatus;
  url: string | null;
  error: string | null;
  sizeBytes: number | null;
  upload: (file: File, opts: UploadOpts) => Promise<UploadResult>;
  /** Re-attempts the last file with the same params. No-op if nothing failed yet. */
  retry: () => Promise<UploadResult | undefined>;
};

/**
 * Per-slot upload state machine for the shared draft-upload flow
 * (`POST /api/v1/admin/uploads`, multipart, `mumzo/tmp/{sessionId}/{slot}`).
 *
 * `slot` identifies the image role within the form (e.g. "main",
 * "gallery-0") — it is not itself state, just the field this call always
 * uploads as. On failure, no automatic retry or backoff runs; the caller
 * wires `retry()` to a "Retry" button, a deliberate design choice.
 */
export function useImageSlotUpload(slot: string): UseImageSlotUploadResult {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);

  const lastAttempt = useRef<{ file: File; opts: UploadOpts } | null>(null);

  const runUpload = useCallback(
    async (file: File, opts: UploadOpts): Promise<UploadResult> => {
      lastAttempt.current = { file, opts };
      setStatus("uploading");
      setError(null);

      const formData = new FormData();
      formData.set("file", file);
      formData.set("entity", opts.entity);
      formData.set("slot", slot);
      if (opts.sessionId) {
        formData.set("sessionId", opts.sessionId);
      }

      try {
        const data = await apiUpload<UploadResponse>("/uploads", formData);
        setStatus("uploaded");
        setUrl(data.url);
        setSizeBytes(data.sizeBytes);
        return { url: data.url, sessionId: data.sessionId };
      } catch (cause) {
        const message =
          cause instanceof ApiError ? cause.message : "Upload failed.";
        setStatus("error");
        setError(message);
        throw cause;
      }
    },
    [slot],
  );

  const upload = useCallback(
    (file: File, opts: UploadOpts) => runUpload(file, opts),
    [runUpload],
  );

  const retry = useCallback(async () => {
    if (!lastAttempt.current) {
      return undefined;
    }
    const { file, opts } = lastAttempt.current;
    return runUpload(file, opts);
  }, [runUpload]);

  return { status, url, error, sizeBytes, upload, retry };
}
