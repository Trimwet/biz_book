import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { 
  FiSearch
} from 'react-icons/fi';
import AnimatedCounter from './AnimatedCounter';
import Logo from './Logo';
import Footer from './Footer';

// Hero Section Component
const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query.length > 0) {
      navigate(`/search?query=${encodeURIComponent(query)}`);
    } else {
      navigate('/search');
    }
  };

  const trendingCategories = ['Electronics', 'Phones', 'Appliances', 'Fashion', 'Computers'];

  return (
    <section className="relative bg-white overflow-hidden">
      {/* Subtle background decorative elements - keeping your original style */}
      <div className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full bg-primary-100 blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full bg-secondary-100 blur-3xl opacity-50 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 py-20 relative">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="xlarge" />
          </div>
          
          {/* Main Headline - keeping your original structure */}
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
            Where Business{' '}
            <span className="text-primary-600">Connects</span>
          </h1>
          
          {/* Subtitle - enhanced with better typography */}
          <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed font-primary">
            The professional marketplace connecting serious shoppers with trusted vendors. 
            Make informed decisions with transparent pricing and verified reviews.
          </p>
          
          {/* CTA Buttons - subtle Apple-style enhancements */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(user ? (user.user_type === 'vendor' ? '/vendor/dashboard' : '/shopper/dashboard') : '/signup')}
              className="bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 hover:shadow-lg"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </button>
            <button
              onClick={() => navigate('/browse')}
              className="border-2 border-neutral-300 text-neutral-700 px-8 py-4 rounded-xl font-semibold hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200"
            >
              Explore Marketplace
            </button>
          </div>

          {/* Search Bar - keeping your original inline style with subtle enhancements */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-shadow duration-200">
              <FiSearch className="w-5 h-5 text-neutral-400" />
              <input
                className="flex-1 outline-none py-2 text-neutral-900 placeholder-neutral-400 font-primary"
                placeholder="Search products, vendors, categories…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              />
              <button 
                onClick={handleSearch} 
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm hover:bg-neutral-800 transition-colors duration-200"
              >
                Search
              </button>
            </div>
          </div>

          {/* Trending Categories - keeping your original style */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {trendingCategories.map((category) => (
              <button
                key={category}
                className="px-3 py-1.5 rounded-full border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
                onClick={() => navigate(`/search?query=${encodeURIComponent(category)}`)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Trust Indicators Section
const TrustIndicators: React.FC = () => {
  return (
    <section className="bg-neutral-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              <AnimatedCounter target={5000} duration={2000} />+
            </div>
            <p className="text-neutral-700 font-medium">Verified Products</p>
            <p className="text-sm text-neutral-500 mt-1">Quality assured inventory</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">
              <AnimatedCounter target={1200} duration={2000} />+
            </div>
            <p className="text-neutral-700 font-medium">Trusted Vendors</p>
            <p className="text-sm text-neutral-500 mt-1">Vetted business partners</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">
              <AnimatedCounter target={24000} duration={2000} />+
            </div>
            <p className="text-neutral-700 font-medium">Customer Reviews</p>
            <p className="text-sm text-neutral-500 mt-1">Authentic feedback</p>
          </div>
        </div>
      </div>
    </section>
  );
};


// Dual Value Proposition
const ValueProposition: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Built for Both Sides of Business
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Whether you're shopping smart or selling better, our platform provides the tools you need to succeed.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10">
          {/* For Shoppers */}
          <div className="bg-primary-50/60 border border-primary-100 p-8 rounded-xl hover:shadow-lg transition-shadow duration-200">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">For Smart Shoppers</h3>
            <p className="text-neutral-700 mb-6">
              Make confident purchasing decisions with comprehensive product comparisons, 
              real customer reviews, and price tracking across multiple vendors.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center text-neutral-700">
                <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced search and filtering
              </li>
              <li className="flex items-center text-neutral-700">
                <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Side-by-side price comparison
              </li>
              <li className="flex items-center text-neutral-700">
                <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Price alerts and watchlists
              </li>
              <li className="flex items-center text-neutral-700">
                <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Verified customer reviews
              </li>
            </ul>
            {!user && (
              <button 
                onClick={() => navigate('/signup/shopper')}
                className="mt-6 w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
              >
                Join as Shopper
              </button>
            )}
          </div>
          
          {/* For Vendors */}
          <div className="bg-secondary-50/60 border border-secondary-100 p-8 rounded-xl hover:shadow-lg transition-shadow duration-200">
            <div className="w-16 h-16 bg-secondary-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">For Trusted Vendors</h3>
            <p className="text-neutral-700 mb-6">
              Grow your business with powerful analytics, customer insights, and direct access 
              to motivated buyers actively comparing your products.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center text-neutral-700">
                <svg className="w-5 h-5 text-secondary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Professional product listings
              </li>
              <li className="flex items-center text-neutral-700">
                <svg className="w-5 h-5 text-secondary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sales analytics and insights
              </li>
              <li className="flex items-center text-neutral-700">
                <svg className="w-5 h-5 text-secondary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Customer review management
              </li>
              <li className="flex items-center text-neutral-700">
                <svg className="w-5 h-5 text-secondary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Competitive market analysis
              </li>
            </ul>
            {!user && (
              <button 
                onClick={() => navigate('/signup/vendor')}
                className="mt-6 w-full bg-secondary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-secondary-700 transition-colors duration-200"
              >
                Join as Vendor
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '1',
      title: 'Discover',
      description: 'Browse verified products from trusted vendors or search with advanced filters to find exactly what you need.'
    },
    {
      number: '2',
      title: 'Compare',
      description: 'View detailed comparisons across multiple vendors, read authentic reviews, and analyze pricing trends.'
    },
    {
      number: '3',
      title: 'Connect',
      description: 'Connect directly with vendors, make informed purchasing decisions, and build lasting business relationships.'
    }
  ];

  return (
    <section className="py-12 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            How BIZ BOOK Works
          </h2>
          <p className="text-lg text-neutral-600">
            Simple, transparent, and professional marketplace experience
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">{step.number}</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">{step.title}</h3>
              <p className="text-neutral-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Final CTA Section
const FinalCTA: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <section className="py-16 bg-white border-t border-neutral-200">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
          Ready to Transform Your Business Experience?
        </h3>
        <p className="text-lg text-neutral-600 mb-8">
          Join thousands of professionals who trust BIZ BOOK for their marketplace needs.
        </p>
        {!user && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
            >
              Get Started Today
            </button>
            <button
              onClick={() => navigate('/browse')}
              className="border-2 border-neutral-300 text-neutral-700 px-8 py-4 rounded-lg font-semibold hover:border-neutral-400 hover:bg-neutral-50 transition-colors duration-200"
            >
              Browse Marketplace
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

// Main Landing Page Component
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <TrustIndicators />
      <ValueProposition />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;