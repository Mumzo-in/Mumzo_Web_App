import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, SlidersHorizontal, ArrowUpDown, X, Check } from "lucide-react";
import { findCategory, productsInCategory } from "./data";
import ProductCard from "./components/ProductCard";
import { rupee } from "./CartContext";

const SORTS = [
  { key: "relevance", label: "Recommended" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "discount", label: "Highest discount" },
  { key: "rating", label: "Top rated" },
];

export default function Category() {
  const { slug } = useParams();
  const category = findCategory(slug);
  const allProducts = productsInCategory(slug);

  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
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
      case "rating": list = [...list].sort((a, b) => b.rating - a.rating); break;
      default: break;
    }
    return list;
  }, [allProducts, sort, selectedBrands, selectedSizes, maxPrice]);

  const activeFilterCount = selectedBrands.length + selectedSizes.length + (maxPrice < 2000 ? 1 : 0);
  const currentSort = SORTS.find(s => s.key === sort);

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

        {/* Sort + Filter — prominent side-by-side buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowSort(true)}
            data-testid="open-sort"
            className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium border ${
              sort !== "relevance" ? "bg-pinkDeep text-white border-pinkDeep" : "bg-white text-foreground border-border/70"
            }`}
          >
            <ArrowUpDown size={15} strokeWidth={2.2} />
            <span>Sort</span>
            <span className="text-[11px] font-normal opacity-80 truncate">· {currentSort.label}</span>
          </button>
          <button
            onClick={() => setShowFilters(true)}
            data-testid="open-filters"
            className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium border ${
              activeFilterCount ? "bg-pinkDeep text-white border-pinkDeep" : "bg-white text-foreground border-border/70"
            }`}
          >
            <SlidersHorizontal size={15} strokeWidth={2.2} />
            <span>Filters</span>
            {activeFilterCount > 0 && <span className="text-[11px]">({activeFilterCount})</span>}
          </button>
        </div>

        {/* Brand quick-chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {category.brands.map(b => (
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

      {/* Sort drawer */}
      {showSort && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setShowSort(false)}
          data-testid="sort-drawer"
        >
          <div
            className="absolute bottom-0 inset-x-0 mx-auto max-w-md bg-background rounded-t-[32px] p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-editorial text-2xl">Sort by</h3>
              <button onClick={() => setShowSort(false)} className="w-8 h-8 rounded-full bg-blush flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="divide-y divide-border/60">
              {SORTS.map(s => (
                <button
                  key={s.key}
                  onClick={() => { setSort(s.key); setShowSort(false); }}
                  data-testid={`sort-${s.key}`}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className={`text-sm ${sort === s.key ? "font-semibold text-pinkDeep" : "text-foreground/80"}`}>
                    {s.label}
                  </span>
                  {sort === s.key && (
                    <div className="w-6 h-6 rounded-full bg-pinkDeep flex items-center justify-center">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
