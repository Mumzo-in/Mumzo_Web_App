import type {
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  useForm,
} from "@tanstack/react-form";
import type {
  ProductFormValues,
  productFormSchema,
} from "./product-form-schema";

type Unset = FormValidateOrFn<ProductFormValues> | undefined;
type UnsetAsync = FormAsyncValidateOrFn<ProductFormValues> | undefined;

export type ProductFormApi = ReturnType<
  typeof useForm<
    ProductFormValues,
    Unset,
    Unset,
    UnsetAsync,
    Unset,
    UnsetAsync,
    typeof productFormSchema,
    UnsetAsync,
    Unset,
    UnsetAsync,
    UnsetAsync,
    unknown
  >
>;
