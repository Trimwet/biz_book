import React, { useState } from 'react';

// 🔍 SMART COMPARISON TOOL - AI-powered product comparison
const SmartComparison = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [comparisonProducts, setComparisonProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [comparisonInsights, setComparisonInsights] = useState(null);

  // 🔍 Search for products to compare
  const searchProducts = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Mock search results - replace with actual API
      const mockResults = [
        {
          id: 1,
          name: 'iPhone 15 Pro Max 256GB',
          price: 1250000,
          vendor: 'TechHub Lagos',
          rating: 4.8,
          reviews: 124,
          location: 'Lagos',
          image: '📱',
          specs: {
            storage: '256GB',
            ram: '8GB',
            camera: '48MP',
            battery: '4422mAh',
            display: '6.7"'
          },
          pros: ['Excellent camera', 'Premium build', 'Long battery life'],
          cons: ['Expensive', 'No charger included']
        },
        {
          id: 2,
          name: 'iPhone 15 Pro Max 256GB',
          price: 1180000,
          vendor: 'ElectroMart Abuja',
          rating: 4.6,
          reviews: 89,
          location: 'Abuja',
          image: '📱',
          specs: {
            storage: '256GB',
            ram: '8GB',
            camera: '48MP',
            battery: '4422mAh',
            display: '6.7"'
          },
          pros: ['Best price', 'Fast delivery', 'Good warranty'],
          cons: ['Limited stock', 'Newer vendor']
        },
        {
          id: 3,
          name: 'Samsung Galaxy S24 Ultra 256GB',
          price: 1100000,
          vendor: 'MobileWorld PH',
          rating: 4.7,
          reviews: 156,
          location: 'Port Harcourt',
          image: '📱',
          specs: {
            storage: '256GB',
            ram: '12GB',
            camera: '200MP',
            battery: '5000mAh',
            display: '6.8"'
          },
          pros: ['S Pen included', 'Better multitasking', 'Larger battery'],
          cons: ['Bulky design', 'Complex UI']
        }
      ];
      
      setSearchResults(mockResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // ➕ Add product to comparison
  const addToComparison = (product) => {
    if (comparisonProducts.length >= 4) {
      alert('You can compare up to 4 products at once');
      return;
    }
    
    if (comparisonProducts.find(p => p.id === product.id)) {
      alert('Product already in comparison');
      return;
    }
    
    setComparisonProducts([...comparisonProducts, product]);
    generateInsights([...comparisonProducts, product]);
  };

  // ➖ Remove product from comparison
  const removeFromComparison = (productId) => {
    const updated = comparisonProducts.filter(p => p.id !== productId);
    setComparisonProducts(updated);
    if (updated.length > 0) {
      generateInsights(updated);
    } else {
      setComparisonInsights(null);
    }
  };

  // 🤖 Generate AI insights
  const generateInsights = (products) => {
    if (products.length < 2) return;

    const prices = products.map(p => p.price);
    
    const insights = {
      bestValue: products.reduce((best, current) => 
        (current.price / current.rating) < (best.price / best.rating) ? current : best
      ),
      cheapest: products.reduce((min, current) => current.price < min.price ? current : min),
      highestRated: products.reduce((max, current) => current.rating > max.rating ? current : max),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length
      },
      savings: Math.max(...prices) - Math.min(...prices),
      recommendations: []
    };

    // Generate smart recommendations
    if (insights.bestValue.rating >= 4.5 && insights.bestValue.price <= insights.priceRange.average) {
      insights.recommendations.push({
        type: 'best_value',
        product: insights.bestValue,
        reason: 'Best balance of price and quality'
      });
    }

    if (insights.savings > 50000) {
      insights.recommendations.push({
        type: 'save_money',
        product: insights.cheapest,
        reason: `Save ₦${insights.savings.toLocaleString()} compared to the most expensive option`
      });
    }

    setComparisonInsights(insights);
  };

  // 🎨 Get comparison score color
  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 📊 Calculate value score
  const calculateValueScore = (product) => {
    const priceScore = (2000000 - product.price) / 2000000 * 5; // Normalize price to 0-5
    const ratingScore = product.rating;
    return ((priceScore + ratingScore) / 2).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Smart Product Comparison
              </h1>
              <p className="text-xl text-gray-600">AI-powered insights to help you make the best buying decision</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-indigo-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-indigo-600 font-medium">
                  {comparisonProducts.length} products comparing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Section */}
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <form onSubmit={searchProducts} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products to compare (e.g., iPhone 15, Samsung TV, MacBook)"
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? '🔍 Searching...' : '🔍 Search'}
            </button>
          </div>
        </form>

        {/* Current Comparison */}
        {comparisonProducts.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📋 Comparing {comparisonProducts.length} Products
            </h3>
            <div className="flex flex-wrap gap-3">
              {comparisonProducts.map(product => (
                <div key={product.id} className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-xl">
                  <span className="mr-2">{product.image}</span>
                  <span className="font-medium">{product.name}</span>
                  <button
                    onClick={() => removeFromComparison(product.id)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🛍️ Search Results</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map(product => (
              <div key={product.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">{product.image}</div>
                  <h4 className="font-bold text-gray-800 mb-2">{product.name}</h4>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    ₦{product.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">{product.vendor}</div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Rating:</span>
                    <span className={`font-medium ${getScoreColor(product.rating)}`}>
                      ⭐ {product.rating} ({product.reviews} reviews)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Location:</span>
                    <span className="font-medium">📍 {product.location}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Value Score:</span>
                    <span className={`font-medium ${getScoreColor(calculateValueScore(product))}`}>
                      🎯 {calculateValueScore(product)}/5
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => addToComparison(product)}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-teal-700 transition-all duration-300"
                >
                  ➕ Add to Compare
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {comparisonProducts.length >= 2 && (
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Detailed Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Feature</th>
                  {comparisonProducts.map(product => (
                    <th key={product.id} className="text-center py-4 px-4 font-semibold text-gray-700 min-w-48">
                      <div className="text-4xl mb-2">{product.image}</div>
                      <div className="text-sm">{product.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-700">💰 Price</td>
                  {comparisonProducts.map(product => (
                    <td key={product.id} className="py-4 px-4 text-center">
                      <span className="text-lg font-bold text-green-600">
                        ₦{product.price.toLocaleString()}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-700">⭐ Rating</td>
                  {comparisonProducts.map(product => (
                    <td key={product.id} className="py-4 px-4 text-center">
                      <span className={`font-bold ${getScoreColor(product.rating)}`}>
                        {product.rating}/5
                      </span>
                      <div className="text-sm text-gray-500">({product.reviews} reviews)</div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-700">🏪 Vendor</td>
                  {comparisonProducts.map(product => (
                    <td key={product.id} className="py-4 px-4 text-center">
                      <div className="font-medium">{product.vendor}</div>
                      <div className="text-sm text-gray-500">📍 {product.location}</div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-700">🎯 Value Score</td>
                  {comparisonProducts.map(product => (
                    <td key={product.id} className="py-4 px-4 text-center">
                      <span className={`text-lg font-bold ${getScoreColor(calculateValueScore(product))}`}>
                        {calculateValueScore(product)}/5
                      </span>
                    </td>
                  ))}
                </tr>
                
                {/* Specifications */}
                {comparisonProducts[0].specs && Object.keys(comparisonProducts[0].specs).map(spec => (
                  <tr key={spec} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium text-gray-700 capitalize">
                      📋 {spec.replace(/([A-Z])/g, ' $1').trim()}
                    </td>
                    {comparisonProducts.map(product => (
                      <td key={product.id} className="py-4 px-4 text-center font-medium">
                        {product.specs[spec] || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {comparisonInsights && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🤖 AI Insights & Recommendations</h3>
          
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-lg font-bold text-green-600">₦{comparisonInsights.savings.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Potential Savings</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-lg font-bold text-blue-600">{comparisonInsights.bestValue.name.split(' ').slice(0, 2).join(' ')}</div>
              <div className="text-sm text-gray-600">Best Value</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-lg font-bold text-yellow-600">{comparisonInsights.highestRated.rating}/5</div>
              <div className="text-sm text-gray-600">Highest Rated</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-lg font-bold text-purple-600">₦{Math.round(comparisonInsights.priceRange.average).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Average Price</div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-4">
            <h4 className="text-xl font-bold text-gray-800">💡 Smart Recommendations</h4>
            {comparisonInsights.recommendations.map((rec, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-start">
                  <div className="text-3xl mr-4">
                    {rec.type === 'best_value' ? '🏆' : '💰'}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-800 mb-2">
                      {rec.type === 'best_value' ? 'Best Value Pick' : 'Budget-Friendly Option'}
                    </h5>
                    <p className="text-gray-600 mb-3">{rec.reason}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">{rec.product.name}</div>
                        <div className="text-sm text-gray-500">{rec.product.vendor}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">₦{rec.product.price.toLocaleString()}</div>
                        <div className="text-sm text-yellow-600">⭐ {rec.product.rating}/5</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pros and Cons */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {comparisonProducts.slice(0, 2).map(product => (
              <div key={product.id} className="bg-white rounded-2xl p-6 shadow-lg">
                <h5 className="font-bold text-gray-800 mb-4">{product.name}</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h6 className="font-semibold text-green-600 mb-2">✅ Pros</h6>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {product.pros.map((pro, index) => (
                        <li key={index}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h6 className="font-semibold text-red-600 mb-2">❌ Cons</h6>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {product.cons.map((con, index) => (
                        <li key={index}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {comparisonProducts.length === 0 && !showResults && (
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Start Comparing Products</h3>
          <p className="text-gray-600 mb-6">
            Search for products above to start comparing prices, features, and vendor ratings. 
            Our AI will provide smart insights to help you make the best decision.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl mb-2">🔍</div>
              <div className="font-semibold text-gray-800">Search Products</div>
              <div className="text-sm text-gray-600">Find similar products from different vendors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="font-semibold text-gray-800">Compare Features</div>
              <div className="text-sm text-gray-600">Side-by-side comparison of specs and prices</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🤖</div>
              <div className="font-semibold text-gray-800">Get AI Insights</div>
              <div className="text-sm text-gray-600">Smart recommendations based on your needs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

export default SmartComparison;