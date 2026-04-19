import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { listListings, ListingItem } from '../api/listings';

export default function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasSearched(true);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { items } = await listListings({ query, limit: 12, sortBy: 'relevance', sortOrder: 'DESC' });
      setResults(items || []);
    } catch (e) {
      console.error('search error:', e);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Search</h1>
          <p className="text-gray-600">Find the best prices from verified vendors</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search bar */}
        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products (e.g., iPhone 15, Samsung TV)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              type="submit"
              disabled={loading}
              className="mt-3 md:mt-0 md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-black disabled:opacity-50"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Results */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-72 bg-white border border-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search terms.</p>
          </div>
        )}

        {!loading && !error && !hasSearched && results.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Start Your Search</h3>
            <p className="text-gray-600">Enter a product name above to begin.</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Search Results</h2>
              <div className="text-sm text-gray-600">{results.length} items</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {results.map((r) => (
                <div key={r.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {r.cover_image ? (
                      <img src={r.cover_image} alt={r.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded bg-gray-200" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{r.title}</h3>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">₦{Number(r.price || 0).toLocaleString()}</span>
                      {r.category && <span className="text-[11px] uppercase tracking-wide text-gray-500">{r.category}</span>}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      <div className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />{r.vendor?.name}</div>
                      <div className="flex items-center mt-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />{r.city ? `${r.city}, ${r.state || 'Nigeria'}` : (r.state || r.vendor?.location || 'Nigeria')}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/product/${r.id}`} className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        View
                      </Link>
                      <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Save
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
