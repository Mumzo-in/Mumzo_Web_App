import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { type FormEvent, useState } from "react";

export default function SearchBar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate({ to: "/search", search: { q: q.trim() } });
    } else {
      navigate({ to: "/search" });
    }
  };

  return (
    <form onSubmit={submitSearch} className="relative flex-1">
      <Search
        size={18}
        className="absolute top-1/2 left-4 -translate-y-1/2 text-foreground/45"
      />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder='Search "diapers", "formula", "wet wipes"…'
        data-testid="web-search"
        className="w-full rounded-full border border-border/70 bg-card py-2.5 pr-4 pl-11 text-sm outline-none transition-colors focus:border-pinkDeep"
      />
    </form>
  );
}
