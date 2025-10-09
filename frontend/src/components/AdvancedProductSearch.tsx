import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { Search, Heart, MapPin, Store, Filter, X } from 'lucide-react';
import config from '../config';

const AdvancedProductSearch = () => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [watchlist, setWatchlist] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    sortBy: 'price',
    sortOrder: 'ASC'
  });

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books',
    'Beauty & Personal Care', 'Automotive', 'Health & Wellness'
  ];

  const locations = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== '')
        )
      });

      const response = await fetch(`${config.API_BASE_URL}/api/products/search?${params}`);
      
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setResults(data.products || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = async (productId) => {
    if (!user) {
      alert('Please log in to add items to your watchlist');
      return;
    }

    try {
      const isInWatchlist = watchlist.has(productId);
      const method = isInWatchlist ? 'DELETE' : 'POST';
      const url = isInWatchlist
        ? `${config.API_BASE_URL}/api/shopper/watchlist/${productId}`
        : `${config.API_BASE_URL}/api/shopper/watchlist`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        ...(method === 'POST' && { body: JSON.stringify({ product_id: productId }) })
      });

      if (response.ok) {
        setWatchlist(prev => {
          const newSet = new Set(prev);
          if (isInWatchlist) {
            newSet.delete(productId);
          } else {
            newSet.add(productId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      sortBy: 'price',
      sortOrder: 'ASC'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Search Products</h1>
          <p className="text-sm text-gray-600">Find the best prices across vendors</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products (e.g., iPhone, Samsung TV)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      placeholder="₦0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      placeholder="₦999,999"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <select
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Locations</option>
                      {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="price">Price</option>
                      <option value="created_at">Newest</option>
                      <option value="name">Name</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ASC">Low to High</option>
                      <option value="DESC">High to Low</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Found {results.length} product{results.length !== 1 ? 's' : ''}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  {/* Image */}
                  <Link to={`/product/${product.id}`} className="block relative">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="text-6xl">📦</div>';
                          }}
                        />
                      ) : (
                        <div className="text-6xl">📦</div>
                      )}
                    </div>

                    {/* Watchlist Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWatchlist(product.id);
                      }}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                        watchlist.has(product.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${watchlist.has(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </Link>

                  {/* Content */}
                  <div className="p-4">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-2xl font-bold text-green-600 mb-3">
                      {formatPrice(product.price)}
                    </p>

                    {/* Vendor Info */}
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Store className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{product.vendor_name}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{product.vendor_location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdvancedProductSearch;
