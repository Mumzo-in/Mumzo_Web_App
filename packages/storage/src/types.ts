/** Who owns the object — mirrors the `{app}` segment in the key convention. */
export type StorageApp = "platform" | "admin" | "private";

/** Which R2 bucket an operation targets. */
export type StorageBucket = "public" | "private";

/** Domain entity an uploaded image belongs to. */
export type UploadEntity =
  | "products"
  | "categories"
  | "brands"
  | "users"
  | "reviews"
  | "invoices"
  | "exports";

/** Result of running an image buffer through the Sharp pipeline. */
export type ProcessedImage = {
  data: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
};
