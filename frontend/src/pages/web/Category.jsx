import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowUpDown, X } from "lucide-react";
import { findCategory, productsInCategory } from "../shop/data";
import WebProductCard from "./WebProductCard";
import { rupee } from "../shop/CartContext";

const SORTS = [
  { key: "relevance", label: "Recommended" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "discount", label: "Highest discount" },
];

export default function WebCategory() {
  const { slug } = useParams();
  const category = findCategory(slug);
  const allProducts = productsInCategory(slug);

  const [sort, setSort] = useState("relevance");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [selectedSizes, setSelectedSizes] = useState([]);

  const sizes = useMemo(() =>
    [...new Set(allProducts.map(p => p.sizes).filter(Boolean))],
    [allProducts]
  );

  const filtered = useMemo(() => {
    let list = allProducts.filter(p => p.price <= maxPrice);
    if (selectedBrands.length) list = list.filter(p => selectedBrands.includes(p.brand));
    if (selectedSizes.length) list = list.filter(p => selectedSizes.includes(p.sizes));
    switch (sort) {
      case "price_asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price_desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "discount": list = [...list].sort((a, b) => b.discount - a.discount); break;
      default: break;
    }
    return list;
  }, [allProducts, sort, selectedBrands, selectedSizes, maxPrice]);

  const activeCount = selectedBrands.length + selectedSizes.length + (maxPrice < 2000 ? 1 : 0);
  const toggle = (arr, setter, val) => setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  const clearAll = () => { setSelectedBrands([]); setSelectedSizes([]); setMaxPrice(2000); };

  if (!category) return <div className="max-w-[1280px] mx-auto px-6 py-16 text-center">Category not found.</div>;

  return (
    <div data-testid="web-category-page" className="max-w-[1280px] mx-auto px-6 lg:px-8 pt-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-foreground/55">
        <Link to="/web" className="hover:text-pinkDeep">Home</Link> <span className="mx-1.5">·</span>
        <span>Categories</span> <span className="mx-1.5">·</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Title */}
      <div className="mt-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-editorial text-4xl lg:text-5xl leading-none">{category.name}</h1>
          <p className="mt-2 text-sm text-foreground/60">{filtered.length} products · {category.tagline}</p>
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            data-testid="web-sort"
            className="appearance-none pl-9 pr-8 py-2.5 rounded-full text-sm font-medium bg-white border border-border/70 text-foreground focus:border-pinkDeep outline-none"
          >
            {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Layout: sidebar + grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 self-start rounded-3xl bg-white border border-border/60 p-6 h-fit">
          <div className="flex items-center justify-between mb-5">
            <p className="font-semibold text-sm">Filters {activeCount > 0 && `(${activeCount})`}</p>
            {activeCount > 0 && (
              <button onClick={clearAll} data-testid="clear-filters" className="text-xs text-pinkDeep font-semibold flex items-center gap-1">
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {/* Brands */}
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold mb-3">Brand</p>
            <div className="space-y-2">
              {category.brands.map(b => (
                <label key={b} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={() => toggle(selectedBrands, setSelectedBrands, b)}
                    data-testid={`filter-brand-${b}`}
                    className="w-4 h-4 rounded border-border/70 accent-pinkDeep"
                  />
                  <span className="text-sm text-foreground/80 group-hover:text-foreground">{b}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold">Max price</p>
              <p className="text-sm font-semibold text-pinkDeep">{rupee(maxPrice)}</p>
            </div>
            <input
              type="range"
              min={100}
              max={2000}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(+e.target.value)}
              data-testid="filter-price"
              className="w-full accent-pinkDeep"
            />
            <div className="flex justify-between text-[11px] text-foreground/50 mt-1">
              <span>₹100</span><span>₹2000</span>
            </div>
          </div>

          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => toggle(selectedSizes, setSelectedSizes, s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      selectedSizes.includes(s) ? "bg-pinkDeep text-white border-pinkDeep" : "bg-white text-foreground border-border/70 hover:border-pinkDeep"
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Grid */}
        <div>
          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-blush/40">
              <p className="font-editorial text-2xl">Nothing matches</p>
              <p className="text-sm text-foreground/60 mt-1">Try loosening the filters.</p>
              <button onClick={clearAll} className="mt-4 px-5 py-2.5 rounded-full bg-pinkDeep text-white text-sm font-semibold">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(p => <WebProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
