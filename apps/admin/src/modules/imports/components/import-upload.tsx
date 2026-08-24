import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@mumzo/ui/components/attachment";
import { Card, CardContent } from "@mumzo/ui/components/card";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { type UploadImportResult, uploadImportFile } from "../api/imports-api";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

function isAcceptedFile(file: File): boolean {
  return ACCEPTED_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Step 1 — drag-and-drop (or browse) a CSV/XLSX, upload it, and hand the
 * parsed headers/suggested mapping up to the wizard once done. */
export default function ImportUpload({
  onUploaded,
}: {
  onUploaded: (result: UploadImportResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (selected: File) => {
    if (!isAcceptedFile(selected)) {
      toast.error("Only .csv and .xlsx files are supported.");
      return;
    }
    setFile(selected);
    setUploading(true);
    try {
      const result = await uploadImportFile(selected);
      onUploaded(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload the file.",
      );
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) void upload(dropped);
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        {!file ? (
          <button
            type="button"
            data-testid="import-dropzone"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center gap-3 rounded-md border border-dashed py-14 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Upload className="text-muted-foreground" size={28} />
            <div>
              <p className="font-medium text-sm">
                Drag & drop your .csv or .xlsx file here
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                or click to browse — max {ACCEPTED_EXTENSIONS.join(", ")}
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) void upload(selected);
              }}
            />
          </button>
        ) : (
          <Attachment
            data-testid="import-file-attachment"
            state={uploading ? "uploading" : "done"}
          >
            <AttachmentMedia>
              <FileSpreadsheet size={18} />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.name}</AttachmentTitle>
              <AttachmentDescription>
                {formatBytes(file.size)}
                {uploading ? " · Uploading…" : " · Uploaded"}
              </AttachmentDescription>
            </AttachmentContent>
            {!uploading && (
              <AttachmentActions>
                <AttachmentAction
                  aria-label="Remove file"
                  onClick={() => setFile(null)}
                >
                  <X size={14} />
                </AttachmentAction>
              </AttachmentActions>
            )}
          </Attachment>
        )}

        {!file && (
          <p className="text-muted-foreground text-xs">
            First row must be a header row. One row per variant — products with
            multiple sizes/colors repeat the same product key across rows.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
