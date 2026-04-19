import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../hooks/useUser';
import { Filter } from 'lucide-react';
import { useProductsBrowse } from '../hooks/useProducts';
import { useWatchlist, useToggleWatchlist } from '../hooks/useWatchlist';
import ProductCard from './ProductCard';
import FilterDrawer from './ui/FilterDrawer';

const CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books',
  'Beauty & Personal Care', 'Automotive', 'Health & Wellness',
];

const ProductBrowse = () => {
  const { user } = useUser() as { user: any };
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  // ── Data fetching via TanStack Query ──────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useProductsBrowse({
    category: filters.category || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    limit: 12,
  });

  const { data: watchlistSet } = useWatchlist(!!user && user.user_type === 'shopper');
  const toggleWatchlistMutation = useToggleWatchlist();

  // Flatten pages into a single product array
  const products = data?.pages.flatMap((p) => p.products ?? []) ?? [];

  // ── Infinite scroll sentinel ──────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { threshold: 0.5 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Watchlist toggle ──────────────────────────────────────────────────────
  const handleToggleWatch = useCallback(
    (productId: number) => {
      if (!user) {
        alert('Please log in to add items to your watchlist');
        return;
      }
      const inWatchlist = watchlistSet?.has(productId) ?? false;
      toggleWatchlistMutation.mutate({ productId, inWatchlist });
    },
    [user, watchlistSet, toggleWatchlistMutation]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-700 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">Browse listings</h1>
              <p className="text-base text-gray-600 mt-2">Professional, clean results tailored to your interests</p>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[44px] min-h-[40px]"
              aria-label="Open filters"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Search + category pills */}
          <div className="mt-6 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, brands or categories…"
                aria-label="Search products"
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <svg className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilters((f) => ({ ...f, category: f.category === cat ? '' : cat }))}
                  className={`px-3 py-1.5 rounded-full text-sm border transition whitespace-nowrap ${
                    filters.category === cat
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop sort controls */}
          <div className="hidden sm:block mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="created_at">Newest</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DESC">High to Low</option>
                  <option value="ASC">Low to High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile filter drawer */}
          <FilterDrawer open={showFilters} onClose={() => setShowFilters(false)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="created_at">Newest</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="DESC">High to Low</option>
                  <option value="ASC">Low to High</option>
                </select>
              </div>
            </div>
          </FilterDrawer>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No results</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={(id: number) => (window.location.href = `/product/${id}`)}
                  inWatchlist={watchlistSet?.has(product.id) ?? false}
                  onToggleWatch={handleToggleWatch}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {isFetchingNextPage && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto" />
                <p className="text-gray-600 mt-2 text-sm">Loading more...</p>
              </div>
            )}

            {!hasNextPage && products.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">You've reached the end!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductBrowse;
