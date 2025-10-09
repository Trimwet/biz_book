import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../hooks/useUser';
import { Link } from 'react-router-dom';
import { Card, Button, useToast } from './ui';
import {
  Search, Heart, Bell, BarChart3, Users, User,
  DollarSign, TrendingUp, Star, ShoppingBag,
  ArrowRight, Target, Award, Eye
} from 'lucide-react';
import config from '../config';

function CreateProfileForm({ onProfileCreated }) {
  const { error: showError } = useToast();
  const { apiRequest } = useUser();
  const [formData, setFormData] = useState({
    full_name: '',
    address: '',
    phone_number: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiRequest('/api/shopper/profile', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      onProfileCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create profile.');
      setIsSubmitting(false);
      
      // Show user-friendly toast notification
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        showError('Unable to connect to server. Please check your internet connection and try again.');
      } else {
        showError(err.response?.data?.error || 'Failed to create profile. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center max-w-lg w-full mx-4">
        {/* Icon container */}
        <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Complete Your Profile
        </h2>
        <p className="text-gray-600 mb-8">Join thousands of smart shoppers finding the best deals every day</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              placeholder="Enter your address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-700 text-white px-6 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Creating your profile...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>Start Shopping Smart</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function ShopperDashboard() {
  const { user, loading, getProfile, apiRequest } = useUser();
  const { success: showSuccess, error: showError } = useToast();

  const [stats, setStats] = useState({
    moneySaved: 0,
    comparisons: 0,
    reviews: 0,
    watchlist: 0,
  });
  const [profileState, setProfileState] = useState('checking'); // 'checking', 'exists', 'missing', 'error'
  const [profileError, setProfileError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiRequest('/api/shopper/stats');
      setStats({
        moneySaved: data.money_saved,
        comparisons: data.comparisons_count,
        reviews: data.reviews_count,
        watchlist: data.watchlist_count,
      });
    } catch (error) {
      console.error('Error fetching stats:', error.response?.data || error.message);
      if (error.response?.data?.action === 'CREATE_PROFILE') {
        setProfileState('missing');
      } else {
        setProfileState('error');
        setProfileError('Failed to load dashboard stats.');

        // Show user-friendly toast notification
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          showError('Unable to connect to server. Please check your internet connection.');
        } else {
          showError('Failed to load dashboard statistics. Please refresh the page.');
        }
      }
    }
  }, [showError]);

  useEffect(() => {
    if (!user && !loading) {
      getProfile();
    }

    const checkAndFetchData = async () => {
      if (user) {
        try {
          const profileCheck = await apiRequest('/api/shopper/profile/exists');

          if (profileCheck.hasProfile) {
            setProfileState('exists');
            fetchStats();
          } else {
            setProfileState('missing');
          }
        } catch (error) {
          console.error('Error checking shopper profile:', error.response?.data || error.message);
          setProfileState('error');
          setProfileError('Could not verify your shopper profile. Please try again later.');
          
          // Show user-friendly toast notification
          if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            showError('Unable to connect to server. Please check your internet connection and try again.');
          } else {
            showError('Could not verify your profile. Please try again later.');
          }
        }
      }
    };

    checkAndFetchData();
  }, [user, loading, getProfile, fetchStats, showError]);

  const handleProfileCreated = () => {
    setProfileState('exists');
    getProfile(); // Refresh user to get shopper_profile details
    fetchStats();
    showSuccess('Profile created successfully! Welcome to your dashboard.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your shopper dashboard</p>
          <Link to="/login" className="bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  if (profileState === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-700" />
        <p className="ml-4 text-gray-600">Checking your profile...</p>
      </div>
    );
  }

  if (profileState === 'missing') {
    return <CreateProfileForm onProfileCreated={handleProfileCreated} />;
  }

  if (profileState === 'error') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{profileError}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Welcome back, {user.shopper_profile?.full_name || user.email}!
                </h1>
                <p className="text-gray-600">Ready to discover amazing deals today?</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 font-medium">Smart Shopper</p>
              </div>
              <div className="bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Money Saved</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₦{stats.moneySaved.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Comparisons</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.comparisons}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Reviews</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.reviews}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Watchlist</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.watchlist}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <div className="bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              <span className="text-sm text-gray-700 font-medium">6 Features</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors">
              <ShoppingBag className="w-7 h-7 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Products</h3>
              <p className="text-gray-600 mb-4">Explore amazing products from vendors across Nigeria in our social feed</p>
              <Link to="/browse" className="inline-flex items-center justify-center w-full px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors space-x-2">
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <Search className="w-7 h-7 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Search</h3>
              <p className="text-gray-600 mb-4">Find specific products with advanced filters and sorting</p>
              <Link to="/search" className="inline-flex items-center justify-center w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-x-2">
                <span>Search Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-red-300 transition-colors">
              <Heart className="w-7 h-7 text-red-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Watchlist</h3>
              <p className="text-gray-600 mb-4">Track price changes on your favorite products</p>
              <Link to="/watchlist" className="inline-flex items-center justify-center w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-x-2">
                <span>View Watchlist</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
              <Bell className="w-7 h-7 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Alerts</h3>
              <p className="text-gray-600 mb-4">Get notified when prices drop on your favorite items</p>
              <Link to="/alerts" className="inline-flex items-center justify-center w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-x-2">
                <span>Manage Alerts</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
              <BarChart3 className="w-7 h-7 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Comparison</h3>
              <p className="text-gray-600 mb-4">AI-powered product comparisons with detailed insights</p>
              <Link to="/compare" className="inline-flex items-center justify-center w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-x-2">
                <span>Compare Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors">
              <Users className="w-7 h-7 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Social Shopping</h3>
              <p className="text-gray-600 mb-4">Connect with shoppers and share experiences</p>
              <Link to="/social" className="inline-flex items-center justify-center w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-x-2">
                <span>Join Community</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
              <User className="w-7 h-7 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Profile</h3>
              <p className="text-gray-600 mb-4">Manage your account settings and preferences</p>
              <Link to="/profile" className="inline-flex items-center justify-center w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-x-2">
                <span>View Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            <button className="hidden md:flex items-center space-x-2 px-3 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Eye className="w-4 h-4" />
              <span>View All</span>
            </button>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="space-y-1">
              <div className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">Deal Found</p>
                  <p className="text-gray-600 text-sm">Saved ₦2,500 on iPhone 15 Pro</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">₦2,500</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">Price Alert</p>
                  <p className="text-gray-600 text-sm">Samsung TV dropped to ₦450,000</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-orange-600">-15%</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white">
                  <Heart className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">Watchlist Addition</p>
                  <p className="text-gray-600 text-sm">MacBook Pro M3 now being monitored</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-rose-600">Tracking</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">Achievement Unlocked</p>
                  <p className="text-gray-600 text-sm">Smart Shopper Badge earned</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-600">+50 XP</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
            
            <div className="md:hidden p-4 border-t border-gray-100">
              <button className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Eye className="w-4 h-4" />
                <span>View All Activity</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopperDashboard;