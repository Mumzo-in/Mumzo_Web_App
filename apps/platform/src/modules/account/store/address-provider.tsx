import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { type Address, seedAddresses } from "../data/address-data";

type AddressDraft = Omit<Address, "id">;

interface AddressContextValue {
  addresses: Address[];
  defaultAddress: Address | null;
  addAddress: (draft: AddressDraft) => Address;
  updateAddress: (id: string, draft: AddressDraft) => void;
  removeAddress: (id: string) => void;
  setDefault: (id: string) => void;
}

const AddressContext = createContext<AddressContextValue | null>(null);

const STORAGE_KEY = "mumzo_addresses_v1";

function readStored(): Address[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Address[]) : seedAddresses;
  } catch {
    return seedAddresses;
  }
}

export function AddressProvider({ children }: { children: ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  }, [addresses]);

  const addAddress = useCallback((draft: AddressDraft) => {
    const address: Address = { ...draft, id: `addr_${Date.now()}` };
    setAddresses((prev) => {
      const list = address.isDefault
        ? prev.map((a) => ({ ...a, isDefault: false }))
        : prev;
      const next = [...list, address];
      if (next.length === 1) next[0].isDefault = true;
      return next;
    });
    return address;
  }, []);

  const updateAddress = useCallback((id: string, draft: AddressDraft) => {
    setAddresses((prev) => {
      const list = draft.isDefault
        ? prev.map((a) => ({ ...a, isDefault: false }))
        : prev;
      return list.map((a) => (a.id === id ? { ...draft, id } : a));
    });
  }, []);

  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (next.length > 0 && !next.some((a) => a.isDefault)) {
        next[0].isDefault = true;
      }
      return next;
    });
  }, []);

  const setDefault = useCallback((id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  }, []);

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    [addresses],
  );

  const value = useMemo<AddressContextValue>(
    () => ({
      addresses,
      defaultAddress,
      addAddress,
      updateAddress,
      removeAddress,
      setDefault,
    }),
    [
      addresses,
      defaultAddress,
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

export function useAddresses(): AddressContextValue {
  const ctx = useContext(AddressContext);
  if (!ctx) {
    throw new Error("useAddresses must be used inside <AddressProvider>");
  }
  return ctx;
}
