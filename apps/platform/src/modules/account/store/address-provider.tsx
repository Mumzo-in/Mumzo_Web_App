import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { authClient } from "@/modules/auth";
import {
  createAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
  updateAddressApi,
} from "../api/addresses-api";
import type { Address } from "../data/address-data";
import { addressesQueryOptions } from "../queries/addresses";

type AddressDraft = Omit<Address, "id">;

interface AddressContextValue {
  addresses: Address[];
  defaultAddress: Address | null;
  isLoading: boolean;
  addAddress: (draft: AddressDraft) => Promise<Address>;
  updateAddress: (id: string, draft: AddressDraft) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
}

const AddressContext = createContext<AddressContextValue | null>(null);

/**
 * Backed by `GET/POST/PATCH/DELETE /api/v1/addresses` — requires a signed-in
 * session (`requireAuth` server-side). Callers that let a signed-out visitor
 * reach these actions (the location picker's save-address step, the
 * `/addresses` page) must gate them behind `useRequireAuth().run(...)` first;
 * this provider does not check auth itself; an unauthenticated call simply
 * fails with a 401 `ApiError`.
 */
export function AddressProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data: addresses = [], isLoading } = useQuery({
    ...addressesQueryOptions,
    enabled: Boolean(session),
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["addresses"] }),
    [queryClient],
  );

  const addAddress = useCallback(
    async (draft: AddressDraft) => {
      const created = await createAddressApi(draft);
      await invalidate();
      return created;
    },
    [invalidate],
  );

  const updateAddress = useCallback(
    async (id: string, draft: AddressDraft) => {
      await updateAddressApi(id, draft);
      await invalidate();
    },
    [invalidate],
  );

  const removeAddress = useCallback(
    async (id: string) => {
      await deleteAddressApi(id);
      await invalidate();
    },
    [invalidate],
  );

  const setDefault = useCallback(
    async (id: string) => {
      await setDefaultAddressApi(id);
      await invalidate();
    },
    [invalidate],
  );

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    [addresses],
  );

  const value = useMemo<AddressContextValue>(
    () => ({
      addresses,
      defaultAddress,
      isLoading,
      addAddress,
      updateAddress,
      removeAddress,
      setDefault,
    }),
    [
      addresses,
      defaultAddress,
      isLoading,
      addAddress,
      updateAddress,
      removeAddress,
      setDefault,
    ],
  );

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
}

const DEFAULT_ADDRESS_VALUE: AddressContextValue = {
  addresses: [],
  defaultAddress: null,
  isLoading: false,
  addAddress: async () => ({}) as never,
  updateAddress: async () => ({}) as never,
  removeAddress: async () => {},
  setDefault: async () => {},
};

export function useAddresses(): AddressContextValue {
  const ctx = useContext(AddressContext);
  if (!ctx) {
    return DEFAULT_ADDRESS_VALUE;
  }
  return ctx;
}
