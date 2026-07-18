import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Open/closed state for the secondary nav panel.
 *
 * Lifted out of `AdminSidebar` because the header's toggle needs it too, and
 * the two are siblings. Context rather than a store — it's one boolean, and
 * the provider already exists at the layout level.
 *
 * Persisted so the choice survives a reload.
 */

const STORAGE_KEY = "mumzo-admin-nav-panel";

type NavPanelValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const NavPanelContext = createContext<NavPanelValue | null>(null);

function readInitial(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return window.localStorage.getItem(STORAGE_KEY) !== "closed";
}

export function NavPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(readInitial);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    window.localStorage.setItem(STORAGE_KEY, next ? "open" : "closed");
  }, []);

  const toggle = useCallback(() => {
    setOpenState((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "open" : "closed");
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ open, setOpen, toggle }),
    [open, setOpen, toggle],
  );

  return (
    <NavPanelContext.Provider value={value}>
      {children}
    </NavPanelContext.Provider>
  );
}

export function useNavPanel(): NavPanelValue {
  const context = useContext(NavPanelContext);
  if (!context) {
    throw new Error("useNavPanel must be used inside <NavPanelProvider>");
  }
  return context;
}
