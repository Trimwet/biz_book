import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { 
  FiStar, FiHeart, FiShare2, FiShoppingCart, FiTrendingUp, 
  FiMapPin, FiPhone, FiMail, FiClock, FiCheck, FiAlertCircle,
  FiBarChart2, FiUsers, FiShield, FiTruck, FiRefreshCw
} from 'react-icons/fi';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Skeleton from './ui/Skeleton';
import CustomerReviews from './CustomerReviews';
import config from '../config';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const fetchProductDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${config.API_BASE_URL}/api/products/${id}`, {
        headers: {
          'Authorization': user?.token ? `Bearer ${user.token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Product not found');
      }

      const data = await response.json();
      setProduct(data.product);

      // Set first image as selected
      if (data.product.image_url) {
        setSelectedImage(0);
      }

    } catch (err) {
      console.error('Error fetching product details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

 useEffect(() => {
   fetchProductDetails();
 }, [id, fetchProductDetails]);

 const addToWatchlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/shopper/watchlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: parseInt(id) })
      });

      if (response.ok) {
        setIsInWatchlist(true);
        // Show success message
      }
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    }
  };

  const addToComparison = () => {
    const comparisonList = JSON.parse(localStorage.getItem('comparison') || '[]');
    if (!comparisonList.includes(parseInt(id))) {
      comparisonList.push(parseInt(id));
      localStorage.setItem('comparison', JSON.stringify(comparisonList));
      // Show success message
    }
  };

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FiStar key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<FiStar key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FiStar key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-20 w-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="space-y-6">
            <Skeleton.Text lines={2} />
            <Skeleton className="h-8 w-32" />
            <Skeleton.Text lines={4} />
            <div className="flex space-x-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/search')}>
            Back to Search
          </Button>
        </Card>
      </div>
    );
  }

  if (!product) return null;

  const images = product.image_url ? [product.image_url] : ['/api/placeholder/400/300'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link to="/search" className="hover:text-blue-600">Search</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/api/placeholder/400/300';
              }}
            />
          </div>
          
          {images.length > 1 && (
            <div className="flex space-x-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-1">
                {renderStars(product.average_rating)}
                <span className="text-sm text-gray-600 ml-2">
                  ({product.review_count} reviews)
                </span>
              </div>
              <Badge variant="secondary">{product.category}</Badge>
            </div>
          </div>

          <div className="border-t border-b border-gray-200 py-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatPrice(product.price)}
            </div>
            <p className="text-gray-600">{product.description}</p>
          </div>

          {/* Vendor Info */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Sold by</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FiUsers className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{product.vendor_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiMapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{product.vendor_location}</span>
              </div>
              {product.vendor_phone && (
                <div className="flex items-center space-x-2">
                  <FiPhone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{product.vendor_phone}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button
                onClick={addToWatchlist}
                variant={isInWatchlist ? "secondary" : "primary"}
                className="flex-1"
                disabled={isInWatchlist}
              >
                <FiHeart className="w-4 h-4 mr-2" />
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </Button>
              <Button onClick={addToComparison} variant="outline">
                <FiBarChart2 className="w-4 h-4 mr-2" />
                Compare
              </Button>
              <Button onClick={shareProduct} variant="outline">
                <FiShare2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <FiShield className="w-4 h-4" />
                <span>Secure Purchase</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiTruck className="w-4 h-4" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiRefreshCw className="w-4 h-4" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'specifications', label: 'Specifications' },
            { id: 'reviews', label: `Reviews (${product.review_count})` },
            { id: 'price-history', label: 'Price History' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Product Overview</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
                
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Key Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">
                            <span className="font-medium capitalize">{key}:</span> {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'specifications' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Specifications</h3>
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <span className="font-medium text-gray-900 capitalize">{key}</span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No specifications available for this product.</p>
              )}
            </Card>
          )}

          {activeTab === 'reviews' && (
            <CustomerReviews
              productId={product.id}
              reviews={product.reviews}
              showAddReview={true}
              showFilters={true}
            />
          )}

          {activeTab === 'price-history' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Price History</h3>
              {product.price_history && product.price_history.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <FiTrendingUp className="w-4 h-4" />
                    <span>Price tracking over time</span>
                  </div>
                  
                  <div className="space-y-3">
                    {product.price_history.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600">{formatDate(entry.date)}</span>
                        <span className="font-medium text-gray-900">{formatPrice(entry.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Price history not available for this product.</p>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Similar Products */}
          {product.similar_products && product.similar_products.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Similar Products</h3>
              <div className="space-y-4">
                {product.similar_products.map(similar => (
                  <Link
                    key={similar.id}
                    to={`/product/${similar.id}`}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={similar.image_url}
                      alt={similar.name}
                      className="w-12 h-12 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/100/100';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {similar.name}
                      </p>
                      <p className="text-sm text-blue-600 font-medium">
                        {formatPrice(similar.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/compare?products=${id}`)}
              >
                <FiBarChart2 className="w-4 h-4 mr-2" />
                Compare with Others
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/alerts')}
              >
                <FiClock className="w-4 h-4 mr-2" />
                Set Price Alert
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={shareProduct}
              >
                <FiShare2 className="w-4 h-4 mr-2" />
                Share Product
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;