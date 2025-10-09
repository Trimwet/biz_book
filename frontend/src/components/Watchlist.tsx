import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Store, Trash2 } from 'lucide-react';
import { useUser } from '../hooks/useUser';

const Watchlist = () => {
  const { apiRequest } = useUser();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/shopper/watchlist');
      setWatchlist(data.watchlist || []);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (productId) => {
    try {
      await apiRequest(`/api/shopper/watchlist/${productId}`, {
        method: 'DELETE'
      });
      setWatchlist(watchlist.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Watchlist</h1>
              <p className="text-sm text-gray-600">
                {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            <div className="flex items-center gap-2 text-red-500">
              <Heart className="w-6 h-6 fill-current" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {watchlist.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">💜</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your watchlist is empty</h3>
            <p className="text-gray-600 mb-6">
              Start adding products to keep track of items you're interested in
            </p>
            <Link
              to="/browse"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* Watchlist Items */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {watchlist.map((item) => (
              <div
                key={item.wishlist_id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                {/* Image */}
                <Link to={`/product/${item.product_id}`} className="block relative">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
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

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (window.confirm('Remove this item from your watchlist?')) {
                        removeFromWatchlist(item.product_id);
                      }
                    }}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Link>

                {/* Content */}
                <div className="p-4">
                  <Link to={`/product/${item.product_id}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>

                  <p className="text-2xl font-bold text-green-600 mb-3">
                    {formatPrice(item.price)}
                  </p>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Vendor Info */}
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Store className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{item.vendor_name}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{item.vendor_location}</span>
                  </div>

                  {/* Category Badge */}
                  {item.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                  )}

                  {/* View Button */}
                  <Link
                    to={`/product/${item.product_id}`}
                    className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
