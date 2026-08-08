import { RotateCw, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError, apiUpload } from "@/core/api/client";

export const MAX_IMAGES = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** One in-flight upload for a picked file, keyed by a unique slot so
 * multiple files selected at once can upload independently. */
type PendingUpload = {
  key: string;
  file: File;
  status: "uploading" | "error";
  error?: string;
};

async function uploadGalleryFile(
  file: File,
  slot: string,
  sessionId: string | null,
): Promise<{ url: string; sessionId: string }> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("entity", "products");
  formData.set("slot", slot);
  if (sessionId) {
    formData.set("sessionId", sessionId);
  }
  const data = await apiUpload<{ url: string; sessionId: string }>(
    "/uploads",
    formData,
  );
  return data;
}

/** Multi-file gallery uploader — every file picked in one go uploads to its
 * own slot but shares one `sessionId`, so the server can finalize the whole
 * gallery in a single copy pass keyed by the eventual product id. */
export function GalleryUploadTile({
  startIndex,
  sessionId,
  onUploaded,
}: {
  startIndex: number;
  sessionId: string | null;
  onUploaded: (url: string, sessionId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const nextIndex = useRef(startIndex);

  async function uploadOne(
    pendingUpload: PendingUpload,
    slot: string,
    forSessionId: string | null,
  ) {
    try {
      const result = await uploadGalleryFile(
        pendingUpload.file,
        slot,
        forSessionId,
      );
      setPending((prev) => prev.filter((p) => p.key !== pendingUpload.key));
      onUploaded(result.url, result.sessionId);
      return result.sessionId;
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : "Upload failed.";
      setPending((prev) =>
        prev.map((p) =>
          p.key === pendingUpload.key
            ? { ...p, status: "error", error: message }
            : p,
        ),
      );
      return undefined;
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    const accepted: PendingUpload[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name} is over 5MB and was skipped.`);
        continue;
      }
      accepted.push({
        key: `${Date.now()}-${file.name}-${Math.random()}`,
        file,
        status: "uploading",
      });
    }
    if (accepted.length === 0) {
      return;
    }
    setPending((prev) => [...prev, ...accepted]);

    // First upload resolves the shared session (when none exists yet) —
    // every other upload in this batch must wait for it, or each would mint
    // its own tmp session and the gallery would never finalize as one unit.
    const [first, ...rest] = accepted;
    if (!first) {
      return;
    }
    const firstSlot = `gallery-${nextIndex.current}`;
    nextIndex.current += 1;
    const resolvedSessionId =
      (await uploadOne(first, firstSlot, sessionId)) ?? sessionId;

    for (const pendingUpload of rest) {
      const slot = `gallery-${nextIndex.current}`;
      nextIndex.current += 1;
      uploadOne(pendingUpload, slot, resolvedSessionId);
    }
  }

  return (
    <>
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
      <button
        className="grid size-24 place-items-center rounded-2xl border border-border border-dashed text-muted-foreground hover:bg-secondary"
        data-testid="admin-product-image-upload-trigger"
        onClick={() => fileInputRef.current?.click()}
        type="button"
      >
        <Upload className="size-5" />
      </button>
      {pending.map((p) => (
        <div className="relative" key={p.key}>
          <div className="grid size-24 place-items-center rounded-2xl border border-border text-muted-foreground">
            {p.status === "uploading" ? (
              <RotateCw className="size-5 animate-spin" />
            ) : (
              <span className="px-2 text-center text-destructive text-xs">
                {p.error ?? "Failed"}
              </span>
            )}
          </div>
          {p.status === "error" ? (
            <button
              aria-label={`Remove ${p.file.name}`}
              className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border border-border bg-card shadow-warm"
              onClick={() =>
                setPending((prev) => prev.filter((row) => row.key !== p.key))
              }
              type="button"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      ))}
    </>
  );
}
