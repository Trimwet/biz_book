import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../hooks/useUser';
import { Link } from 'react-router-dom';
import { useToast, Badge } from './ui';
import {
  Search, Heart, Bell, BarChart3, Users, User,
  DollarSign, Star, ShoppingBag,
  ArrowRight, Award, Eye, Store, Sparkles
} from 'lucide-react';
import BecomeVendorModal from './BecomeVendorModal';
import { motion, AnimatePresence } from 'framer-motion';

const SPONSORED_PRODUCTS = [
  { id: 101, name: "Premium Wireless Headphones", price: 45000, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80" },
  { id: 102, name: "Designer Minimalist Watch", price: 85000, category: "Accessories", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80" },
  { id: 103, name: "Smart Home Security Camera", price: 32000, category: "Smart Home", image: "https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?w=800&q=80" }
];

type IconType = React.ElementType<{ className?: string }>;

type QuickAction = {
  key: string;
  title: string;
  description: string;
  cta: string;
  icon: IconType;
  iconClassName: string;
  borderClassName: string;
  buttonVariant: 'primary' | 'outline' | 'success';
  to?: string;
  onClick?: () => void;
};

function CreateProfileForm({ onProfileCreated }: { onProfileCreated: () => void }) {
  const { error: showError } = useToast() as any;
  const { apiRequest } = useUser() as any;
  const [formData, setFormData] = useState({
    full_name: '',
    address: '',
    phone_number: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiRequest('/api/shopper/profile', { method: 'POST', body: JSON.stringify(formData) });
      onProfileCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to create profile.');
      setIsSubmitting(false);
      if (err?.message?.includes('Network') || err?.code === 'ERR_NETWORK') {
        showError('Unable to connect to server. Please check your internet connection and try again.');
      } else {
        showError(err?.message || 'Failed to create profile. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 text-center max-w-lg w-full mx-4">
        {/* Icon container */}
        <div className="w-16 h-16 bg-neutral-700 rounded-xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-neutral-900 mb-3">
          Complete Your Profile
        </h2>
        <p className="text-neutral-600 mb-8">Join thousands of smart shoppers finding the best deals every day</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Address</label>
            <input
              type="text"
              placeholder="Enter your address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-neutral-700 text-white px-6 py-4 rounded-lg font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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

function DashboardHeader({ displayName, subtitle, shopperBadge, presenceBadge, moneySaved, loading }: { displayName: string, subtitle: string, shopperBadge: string, presenceBadge: string, moneySaved: number, loading: boolean }) {
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <div className="bg-gradient-to-br from-primary-700 to-primary-900 pt-8 pb-16 px-4 md:rounded-b-3xl relative">
      <div className="max-w-6xl mx-auto relative">
        <Link to="/alerts" className="absolute top-0 right-0 text-white/80 hover:text-white transition-colors">
          <Bell className="w-6 h-6 text-white/80 hover:text-white transition-colors" />
        </Link>
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            {initial}
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">
              Welcome back, {displayName}!
            </h1>
            <p className="text-primary-200 text-sm mb-2">{subtitle}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{shopperBadge}</span>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{presenceBadge}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mt-6 mx-0 md:max-w-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-green-300" />
          </div>
          <div>
            <p className="text-primary-200 text-xs uppercase tracking-wide font-medium mb-0.5">Total Money Saved</p>
            {loading ? (
              <div className="h-9 w-32 bg-white/20 animate-pulse rounded" />
            ) : (
              <p className="text-white text-3xl font-bold">₦{moneySaved.toLocaleString()}</p>
            )}
            <p className="text-primary-300 text-xs mt-1">Across all your purchases</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsGrid({ comparisons, reviews, watchlist, loading }: { comparisons: number, reviews: number, watchlist: number, loading: boolean }) {
  return (
    <div className="-mt-8 mx-4 bg-white rounded-2xl shadow-lg border border-neutral-100 mb-6 md:mx-auto md:max-w-6xl relative z-10">
      <div className="grid grid-cols-3 divide-x divide-neutral-100">
        <div className="flex flex-col items-center py-4 px-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-blue-100">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          {loading ? <div className="h-6 w-10 bg-neutral-200 animate-pulse rounded" /> : <p className="text-xl font-bold text-neutral-900">{comparisons}</p>}
          <p className="text-xs text-neutral-500 text-center mt-1">Comparisons</p>
        </div>
        <div className="flex flex-col items-center py-4 px-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-amber-100">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          {loading ? <div className="h-6 w-10 bg-neutral-200 animate-pulse rounded" /> : <p className="text-xl font-bold text-neutral-900">{reviews}</p>}
          <p className="text-xs text-neutral-500 text-center mt-1">Reviews</p>
        </div>
        <div className="flex flex-col items-center py-4 px-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-rose-100">
            <Heart className="w-5 h-5 text-rose-600" />
          </div>
          {loading ? <div className="h-6 w-10 bg-neutral-200 animate-pulse rounded" /> : <p className="text-xl font-bold text-neutral-900">{watchlist}</p>}
          <p className="text-xs text-neutral-500 text-center mt-1">Watchlist</p>
        </div>
      </div>
    </div>
  );
}

function ShopperDashboard() {
  const { user, loading, getProfile, apiRequest } = useUser() as any;
  const { success: showSuccess, error: showError } = useToast() as any;
  const [showBecomeVendorModal, setShowBecomeVendorModal] = useState(false);

  const [stats, setStats] = useState({
    moneySaved: 0,
    comparisons: 0,
    reviews: 0,
    watchlist: 0,
  });
  const [profileState, setProfileState] = useState('checking'); // 'checking', 'exists', 'missing', 'error'
  const [profileError, setProfileError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SPONSORED_PRODUCTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiRequest('/api/shopper/stats');
      setStats({
        moneySaved: data.money_saved || 0,
        comparisons: data.comparisons_count || 0,
        reviews: data.reviews_count || 0,
        watchlist: data.watchlist_count || 0,
      });
    } catch (error: any) {
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
  }, [apiRequest, showError]);

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
        } catch (error: any) {
          console.error('Error checking shopper profile:', error.response?.data || error.message);
          setProfileState('error');
          setProfileError('Could not verify your shopper profile. Please try again later.');
          
          if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            showError('Unable to connect to server. Please check your internet connection and try again.');
          } else {
            showError('Could not verify your profile. Please try again later.');
          }
        }
      }
    };

    checkAndFetchData();
  }, [user, loading, getProfile, fetchStats, apiRequest, showError]);

  const handleProfileCreated = () => {
    setProfileState('exists');
    getProfile(); // Refresh user to get shopper_profile details
    fetchStats();
    showSuccess('Profile created successfully! Welcome to your dashboard.');
  };

  if (loading || profileState === 'checking') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-300 border-t-neutral-700" />
        {profileState === 'checking' && <p className="ml-4 text-neutral-600">Checking your profile...</p>}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 text-center max-w-md mx-4">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Access Required</h2>
          <p className="text-neutral-600 mb-6">Please log in to access your shopper dashboard</p>
          <Link to="/login" className="bg-neutral-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors">
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  if (profileState === 'missing') {
    return <CreateProfileForm onProfileCreated={handleProfileCreated} />;
  }

  if (profileState === 'error') {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center text-red-500">{profileError}</div>;
  }

  const displayName = user.shopper_profile?.full_name || user.first_name || user.email?.split('@')[0] || 'Shopper';

  const quickActions: QuickAction[] = [
    {
      key: 'browse',
      title: 'Browse Products',
      description: 'Explore amazing products from vendors across Nigeria in our social feed',
      cta: 'Start Shopping',
      icon: ShoppingBag,
      iconClassName: 'text-primary-600',
      borderClassName: 'hover:border-primary-300',
      buttonVariant: 'outline',
      to: '/browse',
    },
    {
      key: 'search',
      title: 'Advanced Search',
      description: 'Find specific products with advanced filters and sorting',
      cta: 'Search Products',
      icon: Search,
      iconClassName: 'text-primary-600',
      borderClassName: 'hover:border-primary-300',
      buttonVariant: 'outline',
      to: '/search',
    },
    {
      key: 'watchlist',
      title: 'My Watchlist',
      description: 'Track price changes on your favorite products',
      cta: 'View Watchlist',
      icon: Heart,
      iconClassName: 'text-primary-600',
      borderClassName: 'hover:border-primary-300',
      buttonVariant: 'outline',
      to: '/watchlist',
    },
    {
      key: 'alerts',
      title: 'Smart Alerts',
      description: 'Get notified when prices drop on your favorite items',
      cta: 'Manage Alerts',
      icon: Bell,
      iconClassName: 'text-primary-600',
      borderClassName: 'hover:border-primary-300',
      buttonVariant: 'outline',
      to: '/alerts',
    },
    {
      key: 'compare',
      title: 'Smart Comparison',
      description: 'AI-powered product comparisons with detailed insights',
      cta: 'Compare Products',
      icon: BarChart3,
      iconClassName: 'text-primary-600',
      borderClassName: 'hover:border-primary-300',
      buttonVariant: 'outline',
      to: '/compare',
    },
    {
      key: 'social',
      title: 'Social Shopping',
      description: 'Connect with shoppers and share experiences',
      cta: 'Join Community',
      icon: Users,
      iconClassName: 'text-primary-600',
      borderClassName: 'hover:border-primary-300',
      buttonVariant: 'outline',
      to: '/social',
    },
    {
      key: 'profile',
      title: 'My Profile',
      description: 'Manage your account settings and preferences',
      cta: 'View Profile',
      icon: User,
      iconClassName: 'text-primary-600',
      borderClassName: 'hover:border-primary-300',
      buttonVariant: 'outline',
      to: '/profile',
    },
  ];

  if (!user?.can_sell && user?.user_type !== 'vendor') {
    quickActions.push({
      key: 'vendor',
      title: 'Start Selling',
      description: 'Unlock vendor tools and list your products — keep your shopper account',
      cta: 'Become a Vendor',
      icon: Store,
      iconClassName: 'text-primary-600',
      borderClassName: 'hover:border-primary-300 bg-primary-50/50',
      buttonVariant: 'primary',
      onClick: () => setShowBecomeVendorModal(true),
    });
  } else {
    quickActions.push({
      key: 'vendor-dashboard',
      title: 'Vendor Dashboard',
      description: 'Manage your listings, view analytics and chat with buyers',
      cta: 'Go to Dashboard',
      icon: Store,
      iconClassName: 'text-primary-600',
      borderClassName: 'hover:border-primary-300 bg-primary-50/50',
      buttonVariant: 'primary',
      to: '/vendor/dashboard',
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-8 font-inter">
      <DashboardHeader
        displayName={displayName}
        subtitle="Ready to discover amazing deals today?"
        shopperBadge="Smart Shopper"
        presenceBadge="Online"
        moneySaved={stats.moneySaved}
        loading={loading || profileState === 'checking'}
      />
      
      <StatsGrid
        comparisons={stats.comparisons}
        reviews={stats.reviews}
        watchlist={stats.watchlist}
        loading={loading || profileState === 'checking'}
      />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        
        {/* Sponsored Products Carousel */}
        <div className="mb-8 mt-2 md:mt-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              Featured Products
            </h2>
            <Link to="/browse" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          
          <div className="relative w-full h-[200px] md:h-[260px] rounded-2xl overflow-hidden bg-neutral-900 shadow-sm group">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/90 via-neutral-900/50 to-transparent z-10" />
                <img 
                  src={SPONSORED_PRODUCTS[currentSlide].image} 
                  alt={SPONSORED_PRODUCTS[currentSlide].name}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                
                <div className="absolute inset-0 z-20 flex flex-col justify-center p-6 md:p-8 w-full md:w-2/3">
                  <Badge variant="primary" className="w-fit mb-3 bg-white/20 text-white border-none backdrop-blur-md">
                    Sponsored • {SPONSORED_PRODUCTS[currentSlide].category}
                  </Badge>
                  <h3 className="text-xl md:text-3xl font-bold text-white mb-2 leading-tight">
                    {SPONSORED_PRODUCTS[currentSlide].name}
                  </h3>
                  <p className="text-lg md:text-xl font-semibold text-primary-400 mb-4">
                    ₦{SPONSORED_PRODUCTS[currentSlide].price.toLocaleString()}
                  </p>
                  <Link 
                    to={`/product/${SPONSORED_PRODUCTS[currentSlide].id}`}
                    className="w-fit px-4 py-1.5 bg-white text-neutral-900 text-xs font-semibold rounded-lg hover:bg-neutral-100 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
              {SPONSORED_PRODUCTS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Stats Grid is now part of the Hero header above */}

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900">Quick Actions</h2>
            <div className="hidden md:block bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
              <span className="text-sm text-neutral-700 font-medium">8 Features</span>
            </div>
          </div>
          
          {/* Mobile Icon Grid */}
          <div className="grid grid-cols-3 gap-3 md:hidden">
            {quickActions.map((action) => {
              const ActionContent = () => (
                <>
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-2 mx-auto">
                    <action.icon className={`w-5 h-5 ${action.iconClassName}`} />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-700 leading-tight text-center block w-full">{action.title}</span>
                </>
              );

              return action.to ? (
                <Link
                  key={action.key}
                  to={action.to}
                  className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm border border-neutral-200 active:bg-neutral-50 text-neutral-700"
                >
                  <ActionContent />
                </Link>
              ) : (
                <button
                  key={action.key}
                  type="button"
                  onClick={action.onClick}
                  className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm border border-neutral-200 active:bg-neutral-50 text-neutral-700"
                >
                  <ActionContent />
                </button>
              );
            })}
          </div>

          {/* Desktop Card Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const btnClass =
                action.buttonVariant === 'outline'
                  ? 'text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                  : action.buttonVariant === 'success'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700';

              return (
                <div key={action.key} className={`bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm transition-shadow flex flex-col ${action.borderClassName}`}>
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4 shrink-0">
                    <action.icon className={`w-6 h-6 ${action.iconClassName}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{action.title}</h3>
                  <p className="text-neutral-600 mb-4 text-sm flex-1">{action.description}</p>
                  {action.to ? (
                    <Link to={action.to} className={`inline-flex items-center justify-center w-full px-4 py-2 rounded-lg transition-colors gap-2 font-medium ${btnClass}`}>
                      <span>{action.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button type="button" onClick={action.onClick} className={`inline-flex items-center justify-center w-full px-4 py-2 rounded-lg transition-colors gap-2 font-medium ${btnClass}`}>
                      <span>{action.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6 md:px-0">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900">Recent Activity</h2>
            <button className="hidden md:flex items-center space-x-2 px-3 py-2 text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <Eye className="w-4 h-4" />
              <span>View All</span>
            </button>
          </div>
          
          <div className="bg-white md:border border-neutral-200 md:rounded-2xl -mx-4 md:mx-0 overflow-hidden shadow-sm">
            <div className="divide-y divide-neutral-100">
              <div className="flex items-center p-4 min-h-[4rem] hover:bg-neutral-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">Deal Found</p>
                  <p className="text-neutral-600 text-sm truncate">Saved ₦2,500 on iPhone 15 Pro</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-medium text-primary-600">₦2,500</p>
                  <p className="text-xs text-neutral-500 mt-0.5">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 min-h-[4rem] hover:bg-neutral-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                  <Bell className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">Price Alert</p>
                  <p className="text-neutral-600 text-sm truncate">Samsung TV dropped to ₦450,000</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-medium text-primary-600">-15%</p>
                  <p className="text-xs text-neutral-500 mt-0.5">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 min-h-[4rem] hover:bg-neutral-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">Watchlist Addition</p>
                  <p className="text-neutral-600 text-sm truncate">MacBook Pro M3 now being monitored</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-medium text-primary-600">Tracking</p>
                  <p className="text-xs text-neutral-500 mt-0.5">2 days ago</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 min-h-[4rem] hover:bg-neutral-50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">Achievement Unlocked</p>
                  <p className="text-neutral-600 text-sm truncate">Smart Shopper Badge earned</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-medium text-primary-600">+50 XP</p>
                  <p className="text-xs text-neutral-500 mt-0.5">3 days ago</p>
                </div>
              </div>
            </div>
            
            <div className="md:hidden p-4 border-t border-neutral-100">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-primary-600 border border-primary-600 rounded-xl hover:bg-neutral-100 active:bg-primary-100 transition-colors font-medium">
                <Eye className="w-4 h-4" />
                <span>View All Activity</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Become Vendor Modal */}
      {showBecomeVendorModal && (
        <BecomeVendorModal
          onClose={() => setShowBecomeVendorModal(false)}
          onSuccess={() => { setShowBecomeVendorModal(false); showSuccess('Vendor account activated! Welcome to the seller side.'); }}
        />
      )}
    </div>
  );
}

export default ShopperDashboard;