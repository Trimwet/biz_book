import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { SlidersHorizontal, Search, ChevronDown, X } from 'lucide-react';
import { useProductsBrowse, useCategories } from '../hooks/useProducts';
import { useWatchlist, useToggleWatchlist } from '../hooks/useWatchlist';
import ProductCard from './ProductCard';
import FilterDrawer from './ui/FilterDrawer';
import Skeleton from './ui/Skeleton';

// ─── Skeleton card shown while loading ───────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-3.5 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-1/2 mt-1" />
        <div className="pt-2.5 mt-1 border-t border-neutral-100 flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'created_at:DESC', label: 'Newest first' },
  { value: 'created_at:ASC', label: 'Oldest first' },
  { value: 'price:ASC', label: 'Price: Low to High' },
  { value: 'price:DESC', label: 'Price: High to Low' },
  { value: 'name:ASC', label: 'Name: A–Z' },
  { value: 'name:DESC', label: 'Name: Z–A' },
];

const ProductBrowse = () => {
  const navigate = useNavigate();
  const { user } = useUser() as { user: any };

  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('created_at:DESC');

  const [sortBy, sortOrder] = sort.split(':') as [string, string];

  // ── Categories from API ───────────────────────────────────────────────────
  const { data: categoriesData } = useCategories();
  const apiCategories: string[] = (categoriesData?.categories ?? [])
    .map((c: { category: string }) => c.category)
    .filter(Boolean)
    .slice(0, 12); // cap at 12 pills

  // ── Browse data via TanStack Query infinite scroll ────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useProductsBrowse({
    category: category || undefined,
    sortBy,
    sortOrder,
    limit: 12,
  });

  // Flatten pages → flat product list
  const products = data?.pages.flatMap((p) => p.products ?? []) ?? [];
  const totalProducts: number =
    data?.pages[0]?.pagination?.total_products ?? 0;

  // ── Watchlist ─────────────────────────────────────────────────────────────
  const isShopper = !!user && user.user_type === 'shopper';
  const { data: watchlistSet } = useWatchlist(isShopper);
  const toggleWatchlistMutation = useToggleWatchlist();

  const handleToggleWatch = useCallback(
    (productId: number) => {
      if (!user) {
        navigate('/login');
        return;
      }
      if (!isShopper) return; // vendors don't have watchlists
      toggleWatchlistMutation.mutate({
        productId,
        inWatchlist: watchlistSet?.has(productId) ?? false,
      });
    },
    [user, isShopper, watchlistSet, toggleWatchlistMutation, navigate]
  );

  // ── Infinite scroll sentinel ──────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchNextPage(); },
      { threshold: 0.3 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Search: redirect to /search page (browse doesn't support FTS) ─────────
  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const q = searchInput.trim();
      if (q.length >= 2) {
        navigate(`/search?query=${encodeURIComponent(q)}`);
      }
    },
    [searchInput, navigate]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  const activeFiltersCount = [category, sort !== 'created_at:DESC' ? sort : ''].filter(Boolean).length;

  const clearCategory = () => setCategory('');
  const clearSort = () => setSort('created_at:DESC');

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Newest first';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-14 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Top row: title + filter button */}
          <div className="flex items-center justify-between py-4 gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                Browse Marketplace
              </h1>
              {!isLoading && totalProducts > 0 && (
                <p className="text-sm text-neutral-500 mt-0.5">
                  {totalProducts.toLocaleString()} product{totalProducts !== 1 ? 's' : ''} available
                </p>
              )}
            </div>

            <button
              onClick={() => setShowFilters(true)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-150 sm:hidden
                ${activeFiltersCount > 0
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              aria-label="Open filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-primary-600 text-[10px] font-bold border border-primary-300">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="pb-3">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search products — press Enter or click Search"
                aria-label="Search products"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-28 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:outline-none transition-all duration-150"
              />
              <button
                type="submit"
                disabled={searchInput.trim().length < 2}
                className="absolute right-1.5 px-4 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >
                Search
              </button>
            </div>
            {searchInput.trim().length >= 1 && searchInput.trim().length < 2 && (
              <p className="text-xs text-neutral-400 mt-1 ml-1">Type at least 2 characters to search</p>
            )}
          </form>

          {/* Category pills + desktop sort — hidden on mobile (use drawer) */}
          <div className="hidden sm:flex items-center gap-3 pb-4 overflow-x-auto no-scrollbar">
            {/* All pill */}
            <button
              onClick={clearCategory}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-all duration-150 flex-shrink-0
                ${!category
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                }`}
            >
              All
            </button>

            {apiCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory((prev) => (prev === cat ? '' : cat))}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-all duration-150 flex-shrink-0
                  ${category === cat
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                  }`}
              >
                {cat}
              </button>
            ))}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sort selector */}
            <div className="relative flex-shrink-0">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 bg-white hover:border-neutral-300 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:outline-none cursor-pointer transition-all duration-150"
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Active filter chips ────────────────────────────────────────────── */}
      {(category || sort !== 'created_at:DESC') && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-neutral-500">Active filters:</span>
          {category && (
            <button
              onClick={clearCategory}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-medium hover:bg-primary-100 transition-colors duration-150"
            >
              {category}
              <X className="w-3 h-3" />
            </button>
          )}
          {sort !== 'created_at:DESC' && (
            <button
              onClick={clearSort}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-full text-xs font-medium hover:bg-neutral-200 transition-colors duration-150"
            >
              {sortLabel}
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => { clearCategory(); clearSort(); }}
            className="text-xs text-neutral-400 hover:text-neutral-600 underline-offset-2 hover:underline ml-1 transition-colors duration-150"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Mobile filter drawer ───────────────────────────────────────────── */}
      <FilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter & Sort"
      >
        <div className="flex flex-col space-y-8 py-2">
          {/* Category Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-neutral-900">Categories</h4>
              {category && (
                <button 
                  onClick={clearCategory}
                  className="text-xs text-primary-600 font-medium"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => { clearCategory(); setShowFilters(false); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200
                  ${!category ? 'bg-neutral-900 text-white border-neutral-900 shadow-md shadow-neutral-200' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}
              >
                All
              </button>
              {apiCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat === category ? '' : cat); setShowFilters(false); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200
                    ${category === cat ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* Sort Section */}
          <section>
            <h4 className="text-sm font-bold text-neutral-900 mb-4">Sort Products By</h4>
            <div className="flex flex-col gap-2">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => { setSort(o.value); setShowFilters(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all duration-200 flex items-center justify-between
                    ${sort === o.value
                      ? 'bg-primary-50 text-primary-700 border-primary-200 font-semibold'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                    }`}
                >
                  {o.label}
                  {sort === o.value && (
                    <div className="w-2 h-2 rounded-full bg-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </FilterDrawer>

      {/* ── Product grid ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Error state */}
        {isError && !isLoading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100 mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">Failed to load products</h3>
            <p className="text-neutral-500 text-sm mb-4">There was a problem connecting to the server.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-700 transition-colors duration-150"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && products.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-neutral-100 border border-neutral-200 mb-5">
              <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              {category ? `No products in "${category}"` : 'No products yet'}
            </h3>
            <p className="text-neutral-500 text-sm mb-5">
              {category ? 'Try a different category or clear your filters.' : 'Check back soon — vendors are adding new listings every day.'}
            </p>
            {category && (
              <button
                onClick={clearCategory}
                className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors duration-150"
              >
                Clear category filter
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoading && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {products.map((product, idx) => (
                <div
                  key={product.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${Math.min(idx % 12, 8) * 40}ms`, animationFillMode: 'both' }}
                >
                  <ProductCard
                    product={product}
                    onClick={(id) => navigate(`/product/${id}`)}
                    inWatchlist={isShopper ? (watchlistSet?.has(product.id) ?? false) : undefined}
                    onToggleWatch={isShopper ? handleToggleWatch : undefined}
                  />
                </div>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-8 mt-4" />

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="w-5 h-5 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
                <span className="text-sm text-neutral-500 font-medium">Loading more products…</span>
              </div>
            )}

            {/* End of results */}
            {!hasNextPage && products.length > 0 && (
              <div className="text-center py-10">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 rounded-full shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 inline-block" />
                  <span className="text-sm text-neutral-500 font-medium">
                    All {products.length.toLocaleString()} products shown
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 inline-block" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductBrowse;
