import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const SignupChoice = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <Logo size="xlarge" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Path
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join Nigeria's most trusted marketplace. Whether you're looking to shop smart or grow your business, we have the right tools for you.
          </p>
          
          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-12">
            <div className="flex items-center text-gray-600">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">5,000+ Active Users</span>
            </div>
            <div className="flex items-center text-gray-600">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                <svg className="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="font-medium">4.8/5 Rating</span>
            </div>
            <div className="flex items-center text-gray-600">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">Secure & Trusted</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Shopper Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:border-blue-200 transition-colors">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Smart Shopper</h3>
              <p className="text-gray-600">Make informed purchasing decisions with comprehensive comparison tools</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700">Advanced search and filtering</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700">Real-time price comparison</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700">Smart price alerts and watchlists</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700">Verified customer reviews</span>
              </div>
            </div>
            
            <Link
              to="/signup/shopper"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-center font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              Join as Shopper
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Vendor Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 hover:border-green-200 transition-colors relative">
            {/* Popular Badge */}
            <div className="absolute -top-2 -right-2 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
              Popular Choice
            </div>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Business Vendor</h3>
              <p className="text-gray-600">Grow your business with powerful analytics and direct customer access</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700">Professional product management</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700">Advanced business analytics</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700">Customer insights and reports</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700">Marketing and promotion tools</span>
              </div>
            </div>
            
            <Link
              to="/signup/vendor"
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg text-center font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              Join as Vendor
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupChoice;