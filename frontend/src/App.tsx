import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from './hooks/useUser';
import { useState, useEffect } from 'react';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import AnimatedCounter from './components/AnimatedCounter';
import SignupChoice from './components/SignupChoice';
import VendorSignup from './components/SignupVendor';
import ShopperSignup from './components/SignupShopper';
import Login from './components/Login';
import VendorDashboard from './components/VendorDashboard';
import ShopperDashboard from './components/ShopperDashboard';
import AdvancedProductSearch from './components/AdvancedProductSearch';
import VendorProductManager from './components/VendorProductManager';
import UserProfile from './components/UserProfile';
import Watchlist from './components/Watchlist';
import SmartPriceAlerts from './components/SmartPriceAlerts';
import VendorAnalytics from './components/VendorAnalytics';
import SocialShopping from './components/SocialShopping';
import SmartComparison from './components/SmartComparison';
import VendorSalesReport from './components/VendorSalesReport';
import ProductDetails from './components/ProductDetails';
import EnhancedProductComparison from './components/EnhancedProductComparison';
import ProductBrowse from './components/ProductBrowse';
import CustomerReviews from './components/CustomerReviews';
import Logo from './components/Logo';



// Mobile Menu Component with responsive detection
function MobileMenu({ isOpen, toggleMenu }) {
  const { user, logoutWithConfirmation } = useUser();
  
  // Auto-close sidebar when navbar elements show up (md breakpoint and above)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) { // md breakpoint - when navbar elements show
        toggleMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, toggleMenu]);
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`fixed right-0 top-0 h-full w-72 bg-white shadow-lg transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="text-lg font-semibold text-gray-900">Menu</span>
            <button 
              onClick={toggleMenu} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.user_type}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {user ? (
                <>
                  <Link 
                    to={user.user_type === 'vendor' ? '/vendor/dashboard' : '/shopper/dashboard'} 
                    onClick={toggleMenu} 
                    className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Home</span>
                  </Link>
                  
                  {user.user_type === 'vendor' && (
                    <>
                      <Link 
                        to="/vendor/products" 
                        onClick={toggleMenu} 
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span>Products</span>
                      </Link>
                      <Link 
                        to="/vendor/analytics" 
                        onClick={toggleMenu} 
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Analytics</span>
                      </Link>
                    </>
                  )}
                  
                  {user.user_type === 'shopper' && (
                    <>
                      <Link
                        to="/browse"
                        onClick={toggleMenu}
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>Browse Products</span>
                      </Link>
                      <Link
                        to="/search"
                        onClick={toggleMenu}
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Search</span>
                      </Link>
                      <Link
                        to="/watchlist"
                        onClick={toggleMenu}
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>Watchlist</span>
                      </Link>
                      <Link 
                        to="/alerts" 
                        onClick={toggleMenu} 
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" />
                        </svg>
                        <span>Alerts</span>
                      </Link>
                    </>
                  )}
                  
                  <div className="border-t border-gray-200 my-3"></div>
                  
                  <Link 
                    to="/profile" 
                    onClick={toggleMenu} 
                    className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile</span>
                  </Link>
                  
                  <Link 
                    to="/social" 
                    onClick={toggleMenu} 
                    className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Community</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/" 
                    onClick={toggleMenu} 
                    className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Home</span>
                  </Link>
                  <Link 
                    to="/login" 
                    onClick={toggleMenu} 
                    className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Login</span>
                  </Link>
                  <Link 
                    to="/signup" 
                    onClick={toggleMenu} 
                    className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </nav>
          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {user ? (
              <button 
                onClick={() => {
                  toggleMenu();
                  logoutWithConfirmation();
                }}
                className="w-full flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            ) : (
              <Link 
                to="/signup" 
                onClick={toggleMenu} 
                className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>Get Started</span>
              </Link>
            )}
          </div>
          </div>
        </div>
      </div>
  );
}

// HomePage Component
function HomePage() {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <Logo size="xlarge" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Where Business 
              <span className="text-blue-600">Connects</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              The professional marketplace connecting serious shoppers with trusted vendors. 
              Make informed decisions with transparent pricing and verified reviews.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate(user ? (user.user_type === 'vendor' ? '/vendor/dashboard' : '/shopper/dashboard') : '/signup')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {user ? 'Go to Dashboard' : 'Start Your Journey'}
              </button>
              <button
                onClick={() => navigate('/browse')}
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Explore Marketplace
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                <AnimatedCounter target={5000} duration={2000} />+
              </div>
              <p className="text-gray-700 font-medium">Verified Products</p>
              <p className="text-sm text-gray-500 mt-1">Quality assured inventory</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                <AnimatedCounter target={1200} duration={2000} />+
              </div>
              <p className="text-gray-700 font-medium">Trusted Vendors</p>
              <p className="text-sm text-gray-500 mt-1">Vetted business partners</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                <AnimatedCounter target={24000} duration={2000} />+
              </div>
              <p className="text-gray-700 font-medium">Customer Reviews</p>
              <p className="text-sm text-gray-500 mt-1">Authentic feedback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Value Proposition */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Both Sides of Business
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're shopping smart or selling better, our platform provides the tools you need to succeed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* For Shoppers */}
            <div className="bg-blue-50 border border-blue-100 p-8 rounded-xl">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Smart Shoppers</h3>
              <p className="text-gray-700 mb-6">
                Make confident purchasing decisions with comprehensive product comparisons, 
                real customer reviews, and price tracking across multiple vendors.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced search and filtering
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Side-by-side price comparison
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Price alerts and watchlists
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified customer reviews
                </li>
              </ul>
              {!user && (
                <button 
                  onClick={() => navigate('/signup/shopper')}
                  className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Join as Shopper
                </button>
              )}
            </div>
            
            {/* For Vendors */}
            <div className="bg-green-50 border border-green-100 p-8 rounded-xl">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Trusted Vendors</h3>
              <p className="text-gray-700 mb-6">
                Grow your business with powerful analytics, customer insights, and direct access 
                to motivated buyers actively comparing your products.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Professional product listings
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sales analytics and insights
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Customer review management
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Competitive market analysis
                </li>
              </ul>
              {!user && (
                <button 
                  onClick={() => navigate('/signup/vendor')}
                  className="mt-6 w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Join as Vendor
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How BIZ BOOK Works
            </h2>
            <p className="text-lg text-gray-600">
              Simple, transparent, and professional marketplace experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Discover</h3>
              <p className="text-gray-600">
                Browse verified products from trusted vendors or search with advanced filters 
                to find exactly what you need.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Compare</h3>
              <p className="text-gray-600">
                View detailed comparisons across multiple vendors, read authentic reviews, 
                and analyze pricing trends.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Connect</h3>
              <p className="text-gray-600">
                Connect directly with vendors, make informed purchasing decisions, 
                and build lasting business relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Business Experience?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of professionals who trust BIZ BOOK for their marketplace needs.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/signup')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started Today
              </button>
              <button
                onClick={() => navigate('/browse')}
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Browse Marketplace
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="mb-4">
                <span className="text-2xl font-bold">
                  <span className="text-blue-500">BIZ</span>
                  <span className="text-white"> BOOK</span>
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Your trusted platform for smart shopping and vendor discovery.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => navigate('/browse')} className="hover:text-white transition-colors">
                    Browse Products
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/search')} className="hover:text-white transition-colors">
                    Advanced Search
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/compare')} className="hover:text-white transition-colors">
                    Price Comparison
                  </button>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">About Us</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Contact</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Careers</a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} BIZ BOOK. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Navigation Component
function Navigation() {
  const { user, logoutWithConfirmation } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const isActivePage = (path) => location.pathname === path;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <Logo size="default" />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {user ? (
                <>
                  <Link 
                    to={user.user_type === 'vendor' ? '/vendor/dashboard' : '/shopper/dashboard'} 
                    className={`text-sm font-medium transition-colors ${
                      isActivePage('/vendor/dashboard') || isActivePage('/shopper/dashboard')
                        ? 'text-blue-600' 
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Dashboard
                  </Link>
                  
                  {user.user_type === 'vendor' && (
                    <>
                      <Link 
                        to="/vendor/products" 
                        className={`text-sm font-medium transition-colors ${
                          isActivePage('/vendor/products')
                            ? 'text-blue-600'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Products
                      </Link>
                      <Link 
                        to="/vendor/analytics" 
                        className={`text-sm font-medium transition-colors ${
                          isActivePage('/vendor/analytics')
                            ? 'text-blue-600'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Analytics
                      </Link>
                    </>
                  )}
                  
                  {user.user_type === 'shopper' && (
                    <>
                      <Link
                        to="/browse"
                        className={`text-sm font-medium transition-colors ${
                          isActivePage('/browse')
                            ? 'text-blue-600'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Browse
                      </Link>
                      <Link
                        to="/search"
                        className={`text-sm font-medium transition-colors ${
                          isActivePage('/search')
                            ? 'text-blue-600'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Search
                      </Link>
                      <Link
                        to="/watchlist"
                        className={`text-sm font-medium transition-colors ${
                          isActivePage('/watchlist')
                            ? 'text-blue-600'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Watchlist
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link 
                    to="/" 
                    className={`text-sm font-medium transition-colors ${
                      isActivePage('/')
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/browse" 
                    className={`text-sm font-medium transition-colors ${
                      isActivePage('/browse')
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Browse Products
                  </Link>
                </>
              )}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  {/* Profile */}
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </Link>
                  
                  {/* Logout */}
                  <button 
                    onClick={logoutWithConfirmation} 
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="Logout"
                  >
                    <FiLogOut size={18} />
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={mobileMenuOpen} toggleMenu={toggleMobileMenu} />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <Navigation />
      
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupChoice />} />
          <Route path="/signup/vendor" element={<VendorSignup />} />
          <Route path="/signup/shopper" element={<ShopperSignup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/shopper/dashboard" element={<ShopperDashboard />} />
          <Route path="/search" element={<AdvancedProductSearch />} />
          <Route path="/vendor/products" element={<VendorProductManager />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/alerts" element={<SmartPriceAlerts />} />
          <Route path="/vendor/analytics" element={<VendorAnalytics />} />
          <Route path="/social" element={<SocialShopping />} />
          <Route path="/compare" element={<EnhancedProductComparison />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/vendor/sales" element={<VendorSalesReport />} />
          <Route path="/browse" element={<ProductBrowse />} />
          <Route path="/vendor/:vendorId/products" element={<ProductBrowse />} />
          {/* Vendor Reviews Dashboard */}
          <Route path="/vendor/reviews" element={
            <div className="max-w-6xl mx-auto p-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
                <p className="text-gray-600">Manage and respond to customer feedback and ratings</p>
              </div>
              <CustomerReviews
                showAddReview={false}
                showFilters={true}
                className="w-full"
              />
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;