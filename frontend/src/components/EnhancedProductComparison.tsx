import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { 
  FiStar, FiX, FiPlus, FiBarChart2, FiTrendingUp, FiTrendingDown,
  FiMapPin, FiUsers, FiCheck, FiMinus, FiShoppingCart, FiHeart,
  FiShare2, FiDownload, FiFilter, FiRefreshCw
} from 'react-icons/fi';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Skeleton from './ui/Skeleton';
import config from '../config';

const EnhancedProductComparison = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [products, setProducts] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparisonMode, setComparisonMode] = useState('overview'); // overview, specifications, reviews, pricing
  const [selectedProducts, setSelectedProducts] = useState([]);

  const fetchComparison = useCallback(async (productIds) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${config.API_BASE_URL}/api/products/compare`, {
        method: 'POST',
        headers: {
          'Authorization': user?.token ? `Bearer ${user.token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productIds })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }

      const data = await response.json();
      setProducts(data.comparison);
      setAnalysis(data.analysis);

    } catch (err) {
      console.error('Error fetching comparison:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

 useEffect(() => {
   const productIds = searchParams.get('products');
   if (productIds) {
     const ids = productIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
     if (ids.length >= 2) {
       setSelectedProducts(ids);
       fetchComparison(ids);
     }
   }
 }, [searchParams, fetchComparison]);

 const addProductToComparison = () => {
    // This would open a product search modal
    // For now, we'll just show an alert
    alert('Product search modal would open here');
  };

  const removeProductFromComparison = (productId) => {
    const newIds = selectedProducts.filter(id => id !== productId);
    if (newIds.length >= 2) {
      setSelectedProducts(newIds);
      setSearchParams({ products: newIds.join(',') });
      fetchComparison(newIds);
    } else {
      navigate('/search');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(price);
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

  const getComparisonIndicator = (value, allValues, higherIsBetter = true) => {
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    
    if (value === max && higherIsBetter) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Best</span>;
    } else if (value === min && !higherIsBetter) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Best</span>;
    } else if (value === max && !higherIsBetter) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Highest</span>;
    } else if (value === min && higherIsBetter) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Lowest</span>;
    }
    return null;
  };

  const exportComparison = () => {
    const comparisonData = {
      products: products.map(p => ({
        name: p.name,
        price: p.price,
        rating: p.average_rating,
        vendor: p.vendor_name,
        location: p.vendor_location
      })),
      analysis,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(comparisonData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-comparison.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton.Card key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <FiBarChart2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Comparison Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/search')}
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <FiBarChart2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Comparing Products</h2>
          <p className="text-gray-600 mb-6">
            Add products to compare their features, prices, and reviews side by side.
          </p>
          <button 
            onClick={() => navigate('/search')}
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Comparison</h1>
          <p className="text-gray-600">
            Compare {products.length} products to find the best option for you
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={exportComparison}
            className="inline-flex items-center px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={addProductToComparison}
            className="inline-flex items-center px-4 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Comparison Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatPrice(analysis.price_range.min)} - {formatPrice(analysis.price_range.max)}
              </div>
              <p className="text-sm text-gray-600">Price Range</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {formatPrice(analysis.price_range.average)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {analysis.best_rated.name}
              </div>
              <p className="text-sm text-gray-600">Highest Rated</p>
              <div className="flex items-center justify-center mt-1">
                {renderStars(analysis.best_rated.average_rating)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {analysis.most_affordable.name}
              </div>
              <p className="text-sm text-gray-600">Most Affordable</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatPrice(analysis.most_affordable.price)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Mode Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: FiBarChart2 },
            { id: 'specifications', label: 'Specifications', icon: FiCheck },
            { id: 'pricing', label: 'Pricing', icon: FiTrendingUp },
            { id: 'reviews', label: 'Reviews', icon: FiStar }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setComparisonMode(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  comparisonMode === tab.id
                    ? 'border-gray-700 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {comparisonMode === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg relative">
                  <button
                    onClick={() => removeProductFromComparison(product.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>

                  <div className="p-6">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/300/300';
                        }}
                      />
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                        {getComparisonIndicator(
                          product.price, 
                          products.map(p => p.price), 
                          false
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {renderStars(product.average_rating)}
                          <span className="text-sm text-gray-600 ml-1">
                            ({product.review_count})
                          </span>
                        </div>
                        {getComparisonIndicator(
                          product.average_rating, 
                          products.map(p => p.average_rating), 
                          true
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FiUsers className="w-4 h-4" />
                        <span className="truncate">{product.vendor_name}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FiMapPin className="w-4 h-4" />
                        <span>{product.vendor_location}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <button 
                        className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors" 
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        View Details
                      </button>
                      <div className="flex space-x-2">
                        <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <FiHeart className="w-4 h-4 mr-1" />
                          Save
                        </button>
                        <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <FiShare2 className="w-4 h-4 mr-1" />
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {comparisonMode === 'specifications' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Specifications Comparison</h3>
              
              {/* Get all unique specification keys */}
              {(() => {
                const allSpecs = new Set();
                products.forEach(product => {
                  if (product.specifications) {
                    Object.keys(product.specifications).forEach(key => allSpecs.add(key));
                  }
                });

                if (allSpecs.size === 0) {
                  return (
                    <p className="text-gray-600 text-center py-8">
                      No specifications available for comparison
                    </p>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Specification
                          </th>
                          {products.map(product => (
                            <th key={product.id} className="text-left py-3 px-4 font-medium text-gray-900">
                              {product.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(allSpecs).map(spec => (
                          <tr key={spec} className="border-b border-gray-100">
                            <td className="py-3 px-4 font-medium text-gray-700 capitalize">
                              {spec}
                            </td>
                            {products.map(product => (
                              <td key={product.id} className="py-3 px-4 text-gray-600">
                                {product.specifications?.[spec] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </Card>
          )}

          {comparisonMode === 'pricing' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Pricing Analysis</h3>
              
              <div className="space-y-6">
                {/* Price Comparison Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map(product => {
                    const savings = analysis ? analysis.price_range.max - product.price : 0;
                    const savingsPercentage = analysis ? 
                      ((analysis.price_range.max - product.price) / analysis.price_range.max * 100).toFixed(1) : 0;

                    return (
                      <div key={product.id} className="text-center p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2 truncate">
                          {product.name}
                        </h4>
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {formatPrice(product.price)}
                        </div>
                        {savings > 0 && (
                          <div className="text-sm text-green-600">
                            <FiTrendingDown className="w-4 h-4 inline mr-1" />
                            Save {formatPrice(savings)} ({savingsPercentage}%)
                          </div>
                        )}
                        {product.price === analysis?.price_range.max && (
                          <Badge variant="destructive" className="mt-2">Most Expensive</Badge>
                        )}
                        {product.price === analysis?.price_range.min && (
                          <Badge variant="success" className="mt-2">Best Price</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Price Statistics */}
                {analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatPrice(analysis.price_range.average)}
                      </div>
                      <p className="text-sm text-gray-600">Average Price</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {formatPrice(analysis.price_range.max - analysis.price_range.min)}
                      </div>
                      <p className="text-sm text-gray-600">Maximum Savings</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {(((analysis.price_range.max - analysis.price_range.min) / analysis.price_range.max) * 100).toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">Price Difference</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {comparisonMode === 'reviews' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Reviews Comparison</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 truncate">
                      {product.name}
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {renderStars(product.average_rating)}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {product.average_rating.toFixed(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {product.review_count} reviews
                      </div>

                      {getComparisonIndicator(
                        product.average_rating, 
                        products.map(p => p.average_rating), 
                        true
                      )}

                      <Button 
                        variant="outline" 
                        className="w-full mt-3"
                        onClick={() => navigate(`/product/${product.id}#reviews`)}
                      >
                        Read Reviews
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/search')}>
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Start New Comparison
          </Button>
          <Button variant="outline" onClick={exportComparison}>
            <FiDownload className="w-4 h-4 mr-2" />
            Export Comparison
          </Button>
          <Button variant="outline">
            <FiShare2 className="w-4 h-4 mr-2" />
            Share Comparison
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedProductComparison;