import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { findCategory, productsInCategory } from "./data";
import ProductCard from "./components/ProductCard";
import { rupee } from "./CartContext";

const SORTS = [
  { key: "relevance", label: "Recommended" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "discount", label: "Highest discount" },
];

export default function Category() {
  const { slug } = useParams();
  const category = findCategory(slug);
  const allProducts = productsInCategory(slug);

  const [showFilters, setShowFilters] = useState(false);
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

  const activeFilterCount = selectedBrands.length + selectedSizes.length + (maxPrice < 2000 ? 1 : 0);

  const toggle = (arr, setter, val) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  if (!category) return <div className="p-6">Category not found.</div>;

  return (
    <div data-testid="category-page" className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Link to="/app" data-testid="back-btn" className="w-9 h-9 rounded-full bg-white border border-border/60 flex items-center justify-center">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-editorial text-xl leading-none">{category.name}</h1>
            <p className="text-[11px] text-foreground/55 mt-0.5">{filtered.length} items · {category.tagline}</p>
          </div>
        </div>

        {/* Filter + sort chips */}
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setShowFilters(true)}
            data-testid="open-filters"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${
              activeFilterCount ? "bg-pinkDeep text-white border-pinkDeep" : "bg-white text-foreground border-border/70"
            }`}
          >
            <SlidersHorizontal size={14} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              data-testid="sort-select"
              className="appearance-none pl-8 pr-3 py-1.5 rounded-full text-xs font-medium bg-white border border-border/70 text-foreground"
            >
              {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <ArrowUpDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {category.brands.slice(0, 4).map(b => (
            <button
              key={b}
              onClick={() => toggle(selectedBrands, setSelectedBrands, b)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                selectedBrands.includes(b) ? "bg-blush text-pinkDeep border-rose" : "bg-white text-foreground/70 border-border/70"
              }`}
            >{b}</button>
          ))}
        </div>
      </header>

      {/* Products grid */}
      <div className="px-5 pt-4 grid grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-8 text-center rounded-2xl bg-blush/40">
            <p className="font-editorial text-lg text-foreground">Nothing matches</p>
            <p className="text-sm text-foreground/60 mt-1">Try loosening the filters.</p>
          </div>
        ) : (
          filtered.map(p => <ProductCard key={p.id} product={p} />)
        )}
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setShowFilters(false)}
          data-testid="filter-drawer"
        >
          <div
            className="absolute bottom-0 inset-x-0 mx-auto max-w-md bg-background rounded-t-[32px] p-6 pb-8 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-editorial text-2xl">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-full bg-blush flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Brands */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-3">Brand</p>
              <div className="flex flex-wrap gap-2">
                {category.brands.map(b => (
                  <button
                    key={b}
                    onClick={() => toggle(selectedBrands, setSelectedBrands, b)}
                    className={`px-4 py-2 rounded-full text-sm border ${
                      selectedBrands.includes(b) ? "bg-pinkDeep text-white border-pinkDeep" : "bg-white text-foreground border-border/70"
                    }`}
                  >{b}</button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60">Max price</p>
                <p className="text-sm font-semibold text-pinkDeep">{rupee(maxPrice)}</p>
              </div>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(+e.target.value)}
                className="w-full accent-pinkDeep"
              />
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => toggle(selectedSizes, setSelectedSizes, s)}
                      className={`px-4 py-2 rounded-full text-sm border ${
                        selectedSizes.includes(s) ? "bg-pinkDeep text-white border-pinkDeep" : "bg-white text-foreground border-border/70"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setSelectedBrands([]); setSelectedSizes([]); setMaxPrice(2000); }}
                className="flex-1 py-3 rounded-full border border-border/70 text-sm font-semibold"
              >Clear all</button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3 rounded-full bg-pinkDeep text-white text-sm font-semibold"
              >Show {filtered.length} items</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
