import { useLocation, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

/** Debounce window for as-you-type search — long enough that fast typists
 * don't trigger a navigation/query per keystroke, short enough to still
 * feel live. */
const SEARCH_DEBOUNCE_MS = 500;

export default function SearchBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Debounce timers outlive the component across route changes if left
  // running — clear on unmount so a stale timer never fires a navigation
  // after the search bar itself is gone.
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  /** Already on `/search`: merge `q` into the existing search params so
   * `cat`/`sort`/`brands`/etc. (see `pages/(store)/search.tsx`) survive.
   * Anywhere else: a fresh navigation to `/search` with just `q`. */
  const applySearch = (term: string) => {
    const trimmed = term.trim();
    if (location.pathname === "/search") {
      navigate({
        to: "/search",
        search: (prev) => ({ ...prev, q: trimmed || undefined }),
        replace: true,
      });
    } else if (trimmed) {
      navigate({ to: "/search", search: { q: trimmed } });
    } else {
      navigate({ to: "/search" });
    }
  };

  /** As-you-type: reset the debounce timer on every keystroke, so only a
   * genuine pause (500ms of no further input) fires a navigation — never
   * on every keystroke. */
  const handleChange = (value: string) => {
    setQ(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => applySearch(value),
      SEARCH_DEBOUNCE_MS,
    );
  };

  /** Enter/submit path — fires immediately, bypassing the debounce, for
   * users who type fast and hit Enter. */
  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    applySearch(q);
  };

  return (
    <form onSubmit={submitSearch} className="relative flex-1">
      <Search
        size={18}
        className="absolute top-1/2 left-4 -translate-y-1/2 text-foreground/45"
      />
      <input
        value={q}
        onChange={(e) => handleChange(e.target.value)}
        placeholder='Search "diapers", "formula", "wet wipes"…'
        data-testid="web-search"
        className="w-full rounded-full border border-border/70 bg-card py-2.5 pr-4 pl-11 text-sm outline-none transition-colors focus:border-pinkDeep"
      />
    </form>
  );
}
