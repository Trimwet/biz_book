import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import config from '../config';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Nigerian States
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Federal Capital Territory',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

// Zod schema for vendor signup
const vendorSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[a-z]/, 'Include at least one lowercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  category: z.string().min(1, 'Select a category'),
  location: z.string().min(2, 'Location is required'),
  phone: z
    .string()
    .min(7, 'Enter a valid phone number')
    .regex(/^[+0-9\s-]+$/, 'Only digits, +, spaces and - are allowed')
    .optional()
    .or(z.literal('')),
});

function SignupVendor() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [showPassword, setShowPassword] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(vendorSchema),
    mode: 'onChange', // real-time validation
    defaultValues: {
      businessName: '',
      email: '',
      password: '',
      category: '',
      location: '',
      phone: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/auth/signup/vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (response.ok) {
        login(data.user, data.accessToken);
        navigate('/vendor/dashboard');
      } else {
        alert('Error: ' + (data.error || 'Signup failed'));
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Network error. Please try again.');
    }
  };

  const fieldBase = 'block w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none sm:text-sm transition-all duration-200';
  const fieldValid = 'border-gray-300 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  const fieldInvalid = 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Join BIZ BOOK
          </h2>
          <p className="mt-3 text-xl text-gray-600">
            Create your <span className="text-indigo-600 font-semibold">Vendor Account</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">Start growing your business with our powerful platform</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-2xl shadow-indigo-500/10 sm:rounded-2xl sm:px-10 border border-indigo-50">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Business Name */}
            <div className="group">
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                Business Name
              </label>
              <div className="mt-1 relative">
                <input
                  id="businessName"
                  type="text"
                  {...register('businessName')}
                  className={`${fieldBase} ${errors.businessName ? fieldInvalid : fieldValid}`}
                  placeholder="Enter your business name"
                />
              </div>
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`${fieldBase} ${errors.email ? fieldInvalid : fieldValid}`}
                  placeholder="your@business.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className={`${fieldBase} pr-12 ${errors.password ? fieldInvalid : fieldValid}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
              {errors.password ? (
                <ul className="mt-1 text-sm text-red-600 list-disc list-inside space-y-0.5">
                  <li>{errors.password.message}</li>
                  <li>Tip: Use 8+ chars with upper, lower, and numbers.</li>
                </ul>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Use at least 8 characters with upper, lower and a number.</p>
              )}
            </div>

            {/* Category */}
            <div className="group">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                Business Category
              </label>
              <div className="mt-1 relative">
                <select
                  id="category"
                  {...register('category')}
                  className={`${fieldBase} appearance-none bg-white ${errors.category ? fieldInvalid : fieldValid}`}
                >
                  <option value="">Select category</option>
                  <option value="food">Food & Restaurant</option>
                  <option value="retail">Retail Shop</option>
                  <option value="services">Services</option>
                  <option value="tech">Technology</option>
                  <option value="fashion">Fashion</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>

            {/* Location */}
            <div className="group">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                Location (State)
              </label>
              <div className="mt-1 relative">
                <select
                  id="location"
                  {...register('location')}
                  className={`${fieldBase} appearance-none bg-white ${errors.location ? fieldInvalid : fieldValid}`}
                >
                  <option value="">Select your state</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
            </div>

            {/* Phone */}
            <div className="group">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                Phone Number (optional)
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className={`${fieldBase} ${errors.phone ? fieldInvalid : fieldValid}`}
                  placeholder="+234 800 000 0000"
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account…' : 'Create Vendor Account'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-gray-500">or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-2 transition-colors focus:outline-none">
                <span>Already have an account?</span>
                <span className="underline">Sign in</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupVendor;