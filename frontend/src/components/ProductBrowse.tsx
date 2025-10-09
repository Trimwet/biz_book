import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { Heart, MapPin, Store, Filter, X } from 'lucide-react';
import config from '../config';

const ProductBrowse = () => {
  const { user } = useUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [watchlist, setWatchlist] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  const observerRef = useRef();
  const lastProductRef = useRef();

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books',
    'Beauty & Personal Care', 'Automotive', 'Health & Wellness'
  ];

  // Load products
  useEffect(() => {
    loadProducts(true);
  }, [filters]);

  // Load watchlist
  useEffect(() => {
    if (user) loadWatchlist();
  }, [user]);

  // Infinite scroll
  useEffect(() => {
    if (loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadProducts(false);
        }
      },
      { threshold: 0.5 }
    );

    if (lastProductRef.current) {
      observer.observe(lastProductRef.current);
    }

    return () => {
      if (lastProductRef.current) {
        observer.unobserve(lastProductRef.current);
      }
    };
  }, [loadingMore, hasMore, page]);

  const loadProducts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page + 1;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.category && { category: filters.category })
      });

      const response = await fetch(`${config.API_BASE_URL}/api/products/browse?${params}`);
      
      if (!response.ok) throw new Error('Failed to load products');

      const data = await response.json();

      if (reset) {
        setProducts(data.products || []);
      } else {
        setProducts(prev => [...prev, ...(data.products || [])]);
        setPage(currentPage);
      }

      setHasMore(data.pagination?.has_next || false);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadWatchlist = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/shopper/watchlist`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const ids = new Set(data.watchlist.map(item => item.product_id));
        setWatchlist(ids);
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
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
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Browse Products</h1>
              <p className="text-sm text-gray-600 mt-1">Discover products from vendors across Nigeria</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
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
                    onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DESC">High to Low</option>
                    <option value="ASC">Low to High</option>
                  </select>
                </div>
              </div>

              {(filters.category || filters.sortBy !== 'created_at') && (
                <button
                  onClick={() => setFilters({ category: '', sortBy: 'created_at', sortOrder: 'DESC' })}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  ref={index === products.length - 1 ? lastProductRef : null}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = `/product/${product.id}`}
                >
                  {/* Image */}
                  <div className="relative">
                    <div className="aspect-[4/3] bg-gray-50">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full"><div class="text-3xl text-gray-300">📦</div></div>';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="text-3xl text-gray-300">📦</div>
                        </div>
                      )}
                    </div>

                    {/* Category Badge */}
                    {product.category && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-white text-gray-700 text-xs px-2 py-1 rounded shadow-sm">
                          {product.category}
                        </span>
                      </div>
                    )}

                    {/* Watchlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(product.id);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-full ${
                        watchlist.has(product.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-600 hover:text-red-500'
                      } shadow-sm`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${watchlist.has(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                      {product.name}
                    </h3>

                    <p className="text-lg font-bold text-green-600 mb-2">
                      {formatPrice(product.price)}
                    </p>

                    {/* Vendor and Location */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <div className="flex items-center truncate">
                        <Store className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{product.vendor_name}</span>
                      </div>
                      <div className="flex items-center ml-2 flex-shrink-0">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{product.vendor_location}</span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-gray-400">
                      Listed {formatDate(product.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading More */}
            {loadingMore && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">Loading more...</p>
              </div>
            )}

            {/* End of Results */}
            {!hasMore && products.length > 0 && (
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
