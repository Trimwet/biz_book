import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listListings, ListingItem } from '../api/listings';
import {
  MagnifyingGlass,
  Faders,
  MapPin,
  Eye,
  Heart,
  Scales,
  Storefront,
  ClockCounterClockwise,
} from '@phosphor-icons/react';
import RecommendedStrip from './RecommendedStrip';

export default function ProductSearch() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {}
  }, []);

  // Auto-search on mount if query param exists
  useEffect(() => {
    if (initialQuery.trim()) {
      doSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function doSearch(q: string) {
    setHasSearched(true);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    
    // Save to recent searches
    try {
      const updated = [q.trim(), ...recentSearches.filter(s => s.toLowerCase() !== q.trim().toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) {}

    setLoading(true);
    setError(null);
    try {
      const { items } = await listListings({ query: q, limit: 12, sortBy: 'relevance', sortOrder: 'DESC' });
      setResults(items || []);
    } catch (e) {
      console.error('search error:', e);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  function handleRecentClick(term: string) {
    setQuery(term);
    doSearch(term);
  }

  return (
    <div className="min-h-screen bg-gray-50/50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1">Search</h1>
          <p className="text-sm text-gray-500">Find the best deals from verified vendors</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">

        {/* ── Search bar ───────────────────────────────────────────────────── */}
        <form onSubmit={onSubmit} className="mb-8">
          <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm hover:shadow-md hover:border-gray-300 focus-within:border-blue-300 focus-within:shadow-md focus-within:shadow-blue-50 transition-all duration-200">
            <MagnifyingGlass size={20} className="text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products (e.g., iPhone 15, Samsung TV)"
              className="flex-1 outline-none px-3 py-1.5 text-gray-900 placeholder-gray-400 bg-transparent text-[15px]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-6" role="alert">
            {error}
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                  <div className="h-5 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Initial State (No Search Yet) ────────────────────────────────── */}
        {!loading && !error && !hasSearched && results.length === 0 && (
          <div className="space-y-8 animate-fade-in">
            {recentSearches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <ClockCounterClockwise size={18} className="text-gray-400" />
                  Recently Searched
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecentClick(term)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <RecommendedStrip title="Recommended for you" />
            </div>
          </div>
        )}

        {/* ── No results ───────────────────────────────────────────────────── */}
        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
              <Faders size={28} className="text-gray-400" weight="duotone" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search terms or browse all products.</p>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {!loading && !error && results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Results</h2>
              <span className="text-sm text-gray-400">{results.length} item{results.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((r, idx) => (
                <div
                  key={r.id}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200 animate-slide-in-up group"
                  style={{ animationDelay: `${Math.min(idx, 8) * 40}ms`, animationFillMode: 'both' }}
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                    {r.cover_image ? (
                      <img
                        src={r.cover_image}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gray-100" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3.5">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1.5">{r.title}</h3>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-base font-bold text-gray-900">
                        ₦{Number(r.price || 0).toLocaleString()}
                      </span>
                      {r.category && (
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{r.category}</span>
                      )}
                    </div>

                    {/* Vendor & location */}
                    <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                      {r.vendor?.name && (
                        <div className="flex items-center gap-1.5">
                          <Storefront size={12} className="text-gray-400" />
                          <span className="truncate">{r.vendor.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-gray-400" />
                        <span className="truncate">
                          {r.vendor?.location || 'Nigeria'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 pt-2.5 border-t border-gray-50">
                      <Link
                        to={`/product/${r.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={14} />
                        View
                      </Link>
                      <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Heart size={14} />
                        Save
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Scales size={14} />
                        Compare
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
