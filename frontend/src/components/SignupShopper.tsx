import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// Nigerian States
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Federal Capital Territory',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export default function SignupShopper() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    location: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(formData, 'shopper');
      navigate('/shopper/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Join BIZ BOOK
          </h2>
          <p className="mt-3 text-xl text-gray-600">
            Create your <span className="text-indigo-600 font-semibold">Shopper Account</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Start saving money and discover amazing deals
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-2xl shadow-indigo-500/10 sm:rounded-2xl sm:px-10 border border-indigo-50">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="group">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400
                           focus:outline-none hover:border-indigo-300 transition-all duration-200 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400
                           focus:outline-none hover:border-indigo-300 transition-all duration-200 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           hover:border-indigo-300 transition-all duration-200 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="group">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                Location (State)
              </label>
              <div className="mt-1 relative">
                <select
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           hover:border-indigo-300 transition-all duration-200 sm:text-sm appearance-none bg-white"
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
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg
                         text-sm font-semibold text-white transform hover:scale-[1.02] 
                         transition-all duration-200 focus:outline-none ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                {loading ? 'Creating account...' : 'Create Shopper Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-gray-500">or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 
                                       flex items-center justify-center gap-2 transition-colors focus:outline-none">
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