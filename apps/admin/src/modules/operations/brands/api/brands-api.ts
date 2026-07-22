import { apiRequest } from "@/core/api/client";

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  productCount: number;
};

export function listBrands(search?: string): Promise<Brand[]> {
  return apiRequest<Brand[]>("/brands", { query: { search } });
}

export type BrandInput = {
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
};

export function createBrand(input: BrandInput): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("/brands", { method: "POST", body: input });
}

export function updateBrand(
  id: string,
  input: Partial<BrandInput>,
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/brands/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteBrand(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/brands/${id}`, { method: "DELETE" });
}
