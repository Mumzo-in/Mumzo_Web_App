import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { type Baby, seedBabies } from "../data/baby-data";

type BabyDraft = Omit<Baby, "id">;

interface BabiesContextValue {
  babies: Baby[];
  addBaby: (draft: BabyDraft) => Baby;
  updateBaby: (id: string, draft: BabyDraft) => void;
  removeBaby: (id: string) => void;
}

const BabiesContext = createContext<BabiesContextValue | null>(null);

const STORAGE_KEY = "mumzo_babies_v1";

function readStored(): Baby[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Baby[]) : seedBabies;
  } catch {
    return seedBabies;
  }
}

export function BabiesProvider({ children }: { children: ReactNode }) {
  const [babies, setBabies] = useState<Baby[]>(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(babies));
  }, [babies]);

  const addBaby = useCallback((draft: BabyDraft) => {
    const baby: Baby = { ...draft, id: `baby_${Date.now()}` };
    setBabies((prev) => [...prev, baby]);
    return baby;
  }, []);

  const updateBaby = useCallback((id: string, draft: BabyDraft) => {
    setBabies((prev) => prev.map((b) => (b.id === id ? { ...draft, id } : b)));
  }, []);

  const removeBaby = useCallback((id: string) => {
    setBabies((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const value = useMemo<BabiesContextValue>(
    () => ({ babies, addBaby, updateBaby, removeBaby }),
    [babies, addBaby, updateBaby, removeBaby],
  );

  return (
    <BabiesContext.Provider value={value}>{children}</BabiesContext.Provider>
  );
}

export function useBabies(): BabiesContextValue {
  const ctx = useContext(BabiesContext);
  if (!ctx) {
    throw new Error("useBabies must be used inside <BabiesProvider>");
  }
  return ctx;
}
