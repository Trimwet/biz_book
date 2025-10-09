import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Loading, { SkeletonLoader } from './Loading';
import { Button, Card } from './ui';
import { listListings, ListingItem } from '../api/listings';
import config from '../config';

const ProductSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ListingItem[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; total_pages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    state: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    rating: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'created_at' | 'price'>('relevance');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [pageSize, setPageSize] = useState(20);

  const fetchResults = async (nextPage: number) => {
    setLoading(true);
    try {
      const { items, pagination } = await listListings({
        query: searchQuery,
        category: filters.category || undefined,
        state: filters.state || undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        page: nextPage,
        limit: pageSize,
        sortBy,
        sortOrder
      });
      setSearchResults(items);
      setPagination(pagination || null);
      setPage(nextPage);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // Do not fetch default results when no query provided
      setSearchResults([]);
      setPagination(null);
      return;
    }
    await fetchResults(1);
  };

  // Initialize from URL params (do not auto-fetch unless there's a query)
  React.useEffect(() => {
    const q = searchParams.get('q') || '';
    const st = searchParams.get('state') || '';
    const cat = searchParams.get('category') || '';
    const sb = (searchParams.get('sortBy') as any) || 'relevance';
    const so = (searchParams.get('sortOrder') as any) || 'DESC';
    const ps = parseInt(searchParams.get('pageSize') || '20');
    const pg = parseInt(searchParams.get('page') || '1');
    setSearchQuery(q);
    setFilters((prev) => ({ ...prev, state: st, category: cat }));
    setSortBy(['relevance','created_at','price'].includes(sb) ? sb : 'relevance');
    setSortOrder(so === 'ASC' ? 'ASC' : 'DESC');
    setPageSize([12,20,40,100].includes(ps) ? ps : 20);
    setPage(isNaN(pg) || pg < 1 ? 1 : pg);
    if (q.trim()) {
      fetchResults(isNaN(pg) || pg < 1 ? 1 : pg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters/sort/page size/page to URL
  React.useEffect(() => {
    const params: any = {};
    if (searchQuery) params.q = searchQuery;
    if (filters.state) params.state = filters.state;
    if (filters.category) params.category = filters.category;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (pageSize) params.pageSize = String(pageSize);
    if (page) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [searchQuery, filters.state, filters.category, sortBy, sortOrder, pageSize, page]);

  const addToWatchlist = () => {
    // Mock add to watchlist
    alert('Added to watchlist!');
  };

  const compareProduct = () => {
    // Mock compare function
    alert('Added to comparison!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Search</h1>
          <p className="text-gray-600">Find the best prices from verified vendors</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Products
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products (e.g., iPhone, Samsung TV, MacBook)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 md:px-4 md:py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Searching...
                    </div>
                  ) : (
                    'Search'
                  )}
                </button>             
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-3 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    onClick={() => { setFilters({ category:'', state:'', minPrice:'', maxPrice:'', location:'', rating:'' }); setPage(1); }}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Clear filters
                  </button>
                </div>
                <div className="grid md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="">All Categories</option>
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="home">Home & Garden</option>
                      <option value="sports">Sports</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={filters.state}
                      onChange={(e) => setFilters({...filters, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="">All States</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja (FCT)</option>
                      <option value="Rivers">Rivers</option>
                      <option value="Oyo">Oyo</option>
                      <option value="Kano">Kano</option>
                      <option value="Ogun">Ogun</option>
                      <option value="Kaduna">Kaduna</option>
                      <option value="Anambra">Anambra</option>
                      <option value="Enugu">Enugu</option>
                      <option value="Delta">Delta</option>
                      <option value="Edo">Edo</option>
                      <option value="Imo">Imo</option>
                      <option value="Akwa Ibom">Akwa Ibom</option>
                      <option value="Plateau">Plateau</option>
                      <option value="Others">Other State</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      placeholder="₦0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      placeholder="₦999,999"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select
                      value={filters.location}
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="">All Locations</option>
                      <option value="lagos">Lagos</option>
                      <option value="abuja">Abuja</option>
                      <option value="port-harcourt">Port Harcourt</option>
                      <option value="kano">Kano</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                    <select
                      value={filters.rating}
                      onChange={(e) => setFilters({...filters, rating: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="">Any Rating</option>
                      <option value="4">4+ Stars</option>
                      <option value="4.5">4.5+ Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Search Results */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(pageSize)].map((_, i) => (
              <div key={i} className="h-72 bg-white border border-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}
        
        {!loading && searchResults.length === 0 && searchQuery && (
          <div className="text-center py-12 fade-in">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters.</p>
          </div>
        )}
        
        {!loading && searchResults.length > 0 && (
          <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900">
                {pagination ? `Search Results (${pagination.total} listings found)` : 'Search Results'}
              </h2>
              <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Sort</span>
                    <select
                      className="px-3 py-1 border rounded text-sm"
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value as any); fetchResults(1); }}
                    >
                      <option value="relevance">Relevance</option>
                      <option value="created_at">Newest</option>
                      <option value="price">Price</option>
                    </select>
                    <select
                      className="px-3 py-1 border rounded text-sm"
                      value={sortOrder}
                      onChange={(e) => { setSortOrder(e.target.value as any); fetchResults(1); }}
                    >
                      <option value="DESC">Desc</option>
                      <option value="ASC">Asc</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Rows</span>
                      <select
                        className="px-2 py-1 border rounded text-sm"
                        value={pageSize}
                        onChange={(e) => { setPageSize(parseInt(e.target.value as any)); setPage(1); fetchResults(1); }}
                      >
                        <option value={12}>12</option>
                        <option value={20}>20</option>
                        <option value={40}>40</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Page</span>
                      <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={!pagination || page <= 1}
                        onClick={() => { setPage(page - 1); fetchResults(page - 1); }}
                      >
                        Prev
                      </button>
                      <span className="text-sm text-gray-700">
                        {pagination ? `${page} / ${pagination.total_pages}` : page}
                      </span>
                      <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={!pagination || page >= (pagination?.total_pages || 1)}
                        onClick={() => { setPage(page + 1); fetchResults(page + 1); }}
                      >
                        Next
                      </button>
                    </div>
                </div>
              </div>
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((listing) => (
                <div key={listing.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
                  <div className="relative">
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {listing.cover_image ? (
                        <img src={listing.cover_image} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-4xl">🛍️</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{listing.title}</h3>
                    
                    <div className="mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">₦{Number(listing.price || 0).toLocaleString()}</span>
                        {listing.category && (
                          <span className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-0.5">{listing.category}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {listing.vendor?.name}
                      </div>
                      <div className="flex items-center mt-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.city ? `${listing.city}, ${listing.state || 'Nigeria'}` : (listing.state || listing.vendor?.location || 'Nigeria')}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/product/${listing.id}`}
                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => addToWatchlist(listing.id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Watchlist
                      </button>
                      <button
                        onClick={() => compareProduct(listing.id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Compare
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !loading && !searchQuery && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Start Your Search</h3>
            <p className="text-gray-600 mb-6">
              Enter a product name above to find the best prices from verified vendors across Nigeria.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['iPhone 15', 'Samsung TV', 'MacBook Pro', 'Nike Shoes'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchQuery(suggestion)}
                  className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;