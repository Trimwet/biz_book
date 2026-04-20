import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import Logo from './Logo';
import {
  Eye,
  EyeSlash,
  EnvelopeSimple,
  Lock,
  ShieldCheck,
  ArrowRight,
  GoogleLogo,
} from '@phosphor-icons/react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(formData.email, formData.password);
      if (data?.user?.user_type === 'vendor') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/shopper/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />

        <div className="relative max-w-sm text-center px-8">
          <div className="mb-8">
            <Logo size="xlarge" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            Welcome back
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your campus marketplace awaits. Compare prices, chat with vendors, and shop smarter.
          </p>

          <div className="space-y-2.5 text-left">
            {[
              'Compare prices across campus vendors',
              'Smart price alerts & tracking',
              'Verified reviews from students',
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 rounded-xl bg-white/80 border border-gray-100 px-4 py-2.5"
              >
                <ShieldCheck size={16} weight="fill" className="text-blue-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-5 sm:px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo size="large" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in</h2>
            <p className="mt-1.5 text-sm text-gray-500">Continue to your dashboard</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} aria-describedby={error ? 'login-error' : undefined}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <EnvelopeSimple size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-[15px]"
                  aria-invalid={!!error}
                  placeholder="you@university.edu"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-[15px]"
                  aria-invalid={!!error}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div id="login-error" role="alert" className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Remember me
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                onClick={() => window.location.assign('/forgot')}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} weight="bold" />
                </>
              )}
            </button>

            {/* Google */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <GoogleLogo size={18} weight="bold" />
              Continue with Google
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8">
            <div className="relative flex items-center">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-xs text-gray-400">New to BIZ BOOK?</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="mt-4 text-center">
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                Create your free account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;