import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@mumzo/ui/components/field";
import { X } from "lucide-react";
import { GalleryUploadTile, MAX_IMAGES } from "./gallery-upload-tile";
import type { ProductFormApi } from "./product-form-api";

export function ProductImagesSection({ form }: { form: ProductFormApi }) {
  return (
    <div className="md:col-span-2">
      <form.Field name="images">
        {(imagesField) => {
          const images: string[] = imagesField.state.value ?? [];
          return (
            <form.Field name="uploadSessionId">
              {(sessionField) => (
                <Field>
                  <FieldLabel>Gallery</FieldLabel>
                  <div className="flex flex-wrap gap-3">
                    {images.map((url) => (
                      <div className="relative" key={url}>
                        <img
                          alt=""
                          className="size-24 rounded-2xl border object-cover"
                          src={url}
                        />
                        <button
                          aria-label="Remove image"
                          className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border border-border bg-card shadow-warm"
                          onClick={() =>
                            imagesField.handleChange(
                              images.filter((image) => image !== url),
                            )
                          }
                          type="button"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {images.length < MAX_IMAGES ? (
                      <GalleryUploadTile
                        onUploaded={(url, sessionId) => {
                          imagesField.handleChange((prev) => [
                            ...(prev ?? []),
                            url,
                          ]);
                          sessionField.handleChange(sessionId);
                        }}
                        sessionId={sessionField.state.value}
                        startIndex={images.length}
                      />
                    ) : null}
                  </div>
                  <FieldDescription>
                    First image is the primary, shown as the main product page
                    photo and in product cards. Up to {MAX_IMAGES} images, 5MB
                    max each. {images.length}/{MAX_IMAGES} used.
                  </FieldDescription>
                </Field>
              )}
            </form.Field>
          );
        }}
      </form.Field>
    </div>
  );
}
