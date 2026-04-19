import { useEffect, useState, useCallback } from 'react';
import { useUser } from '../hooks/useUser';
import { Link } from 'react-router-dom';
import { Card, Button } from './ui';
import {
  Package, Star, Users, BarChart3, User, MessageSquare, Share2, Search,
  TrendingUp, ArrowRight, Target, Award, Eye, Store,
  DollarSign, Bell, Activity
} from 'lucide-react';

import VendorListingsTable from './VendorListingsTable';

function VendorDashboard() {
  const { user, loading, getProfile, apiRequest } = useUser();
  const [dashboardStats, setDashboardStats] = useState({
    productCount: 0,
    averageRating: 0,
    reviewCount: 0,
    monthlyRevenue: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Fetch products count
      const productsData = await apiRequest('/api/vendor/products');

      // Fetch sales analytics with fallback paths (handles older backend aliases)
      const paths = [
        '/api/vendors/analytics?period=30d',
        '/api/vendor/analytics?period=30d',
        '/api/vendors/sales/analytics?period=30d',
      ];
      let analyticsData = null;
      let lastErr = null;
      for (const endpoint of paths) {
        try {
          analyticsData = await apiRequest(endpoint);
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!analyticsData) throw new Error(`Failed to fetch analytics: ${lastErr?.message || 'Unknown error'}`);
      const monthlyRevenue = (analyticsData?.summary?.total_revenue ?? analyticsData?.total_revenue ?? 0);

      // Update dashboard stats with real data
      setDashboardStats({
        productCount: productsData.totalProducts || productsData.products?.length || 0,
        averageRating: 4.8, // TODO: replace with real reviews endpoint
        reviewCount: 156,   // TODO: replace with real reviews endpoint
        monthlyRevenue
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback data
      setDashboardStats({ productCount: 0, averageRating: 0, reviewCount: 0, monthlyRevenue: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    if (!user && !loading) {
      getProfile();
    }
  }, [user, loading, getProfile]);

  useEffect(() => {
    if (user && user.user_type === 'vendor') {
      fetchDashboardStats();
    }
  }, [user, fetchDashboardStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your vendor dashboard</p>
          <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'overview'|'listings'>('overview');

  // Hash-based tab switch to avoid route changes
  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === '#listings') setActiveTab('listings');
      else setActiveTab('overview');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Welcome back, {user.vendor_profile?.business_name || user.email}!
                </h1>
                <p className="text-gray-600">Manage your business and grow your customer base</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600 font-medium">Business Account</p>
              </div>
              <div className="bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-6 flex items-center gap-3 border-b border-gray-200">
          <button onClick={() => { setActiveTab('overview'); history.replaceState(null,'', '#'); }} className={`py-2 px-3 text-sm font-medium ${activeTab==='overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>Overview</button>
          <button onClick={() => { setActiveTab('listings'); history.replaceState(null,'', '#listings'); }} className={`py-2 px-3 text-sm font-medium ${activeTab==='listings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>Listings</button>
        </div>
        {activeTab === 'overview' && (
        <>
        {/* Stats */}
        {statsLoading ? (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="h-6 w-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Products Listed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.productCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.averageRating}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.reviewCount}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₦{dashboardStats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Business Tools</h2>
            <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <span className="text-sm text-blue-600 font-medium">7 Features</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <Package className="w-7 h-7 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Products</h3>
              <p className="text-gray-600 mb-4">Add, edit, or remove your product listings and update prices</p>
              <Link to="/vendor/products" className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors space-x-2">
                <span>Manage Inventory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-yellow-300 transition-colors">
              <MessageSquare className="w-7 h-7 text-yellow-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Reviews</h3>
              <p className="text-gray-600 mb-4">View and respond to customer feedback and ratings</p>
              <Link to="/vendor/reviews" className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors space-x-2">
                <span>View Reviews</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
              <User className="w-7 h-7 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Profile</h3>
              <p className="text-gray-600 mb-4">Manage your account and business information</p>
              <Link to="/profile" className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors space-x-2">
                <span>Manage Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
              <BarChart3 className="w-7 h-7 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Analytics</h3>
              <p className="text-gray-600 mb-4">Get detailed insights about your business performance</p>
              <Link to="/vendor/analytics" className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors space-x-2">
                <span>View Analytics</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors">
              <DollarSign className="w-7 h-7 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales Reports</h3>
              <p className="text-gray-600 mb-4">Track your daily sales and monitor business performance</p>
              <Link to="/vendor/sales" className="inline-flex items-center justify-center w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors space-x-2">
                <span>Manage Sales</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
        
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors">
              <Share2 className="w-7 h-7 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Social Shopping</h3>
              <p className="text-gray-600 mb-4">Connect with customers and build your community</p>
              <Link to="/social" className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors space-x-2">
                <span>Join Community</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-rose-300 transition-colors">
              <Search className="w-7 h-7 text-rose-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Comparison</h3>
              <p className="text-gray-600 mb-4">See how your products compare with competitors</p>
              <Link to="/compare" className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors space-x-2">
                <span>Compare Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        </>
        )}

        {activeTab === 'listings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Listings</h2>
              <p className="text-gray-600 mb-4">Manage live offers for your products. Bulk update price, stock, or status.</p>
              <VendorListingsTable />
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            <button className="hidden md:flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Eye className="w-4 h-4" />
              <span>View All</span>
            </button>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="space-y-1">
              <div className="flex items-center p-4 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                  <Star className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900">New 5-star review received</p>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600 text-sm">Customer loved your Samsung Galaxy A54</p>
                    <div className="hidden md:flex items-center text-amber-600 text-sm font-medium">
                      <Award className="w-4 h-4 mr-1" />
                      <span>+50 XP</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
                <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center p-4 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900">Price comparison viewed</p>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600 text-sm">Your iPhone 15 Pro was compared 12 times today</p>
                    <div className="hidden md:flex items-center text-emerald-600 text-sm font-medium">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>₦2.5M potential</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">4 hours ago</p>
                </div>
                <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900">Product inquiry received</p>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600 text-sm">Customer asked about MacBook Pro availability</p>
                    <div className="hidden md:flex items-center text-blue-600 text-sm font-medium">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span>Respond</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                </div>
                <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900">Analytics milestone reached</p>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600 text-sm">Your store reached 1,000 product views this month</p>
                    <div className="hidden md:flex items-center text-purple-600 text-sm font-medium">
                      <Target className="w-4 h-4 mr-1" />
                      <span>Milestone</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                </div>
                <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
