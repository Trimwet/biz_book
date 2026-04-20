import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import Logo from './Logo';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeSlash,
  ShieldCheck,
  Storefront,
  CaretDown,
} from '@phosphor-icons/react';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Federal Capital Territory',
  'Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara',
  'Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];

const BUSINESS_CATEGORIES = [
  'Electronics','Fashion & Clothing','Food & Groceries','Health & Beauty',
  'Home & Garden','Sports & Outdoors','Computers & Laptops','Phones & Tablets',
  'Automotive','Books & Education','Services','Other',
];

// ── Validation ────────────────────────────────────────────────────────────────

const baseSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/[0-9]/, 'Include a number')
    .regex(/[^A-Za-z0-9]/, 'Include a special character'),
  location: z.string().min(1, 'Select your state'),
  wantToSell: z.boolean(),
  businessName: z.string().optional(),
  businessCategory: z.string().optional(),
  phone: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.wantToSell) {
    if (!data.businessName || data.businessName.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Business name is required', path: ['businessName'] });
    }
    if (!data.businessCategory) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a business category', path: ['businessCategory'] });
    }
  }
});

type FormValues = z.infer<typeof baseSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignupChoice() {
  const navigate = useNavigate();
  const { register: registerUser, apiRequest } = useUser() as any;
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '', email: '', password: '', location: '',
      wantToSell: false, businessName: '', businessCategory: '', phone: '',
    },
  });

  const wantToSell = watch('wantToSell');

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    setEmailTaken(false);
    try {
      await registerUser({ fullName: values.fullName, email: values.email, password: values.password, location: values.location }, 'shopper');

      if (values.wantToSell && values.businessName && values.businessCategory) {
        try {
          await apiRequest('/api/auth/upgrade-to-vendor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessName: values.businessName,
              category: values.businessCategory,
              location: values.location,
              phone: values.phone || '',
            }),
          });
          navigate('/vendor/dashboard');
        } catch {
          navigate('/shopper/dashboard');
        }
      } else {
        navigate('/shopper/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to create account. Please try again.';
      if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exists')) {
        setEmailTaken(true);
        setServerError('That email is already registered. Try signing in instead.');
      } else {
        setServerError(msg);
      }
    }
  };

  // ── Field helpers ─────────────────────────────────────────────────────────
  const input = (hasError: boolean) =>
    `w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-[15px] ${
      hasError
        ? 'border-red-200 focus:ring-red-500/20 focus:border-red-400'
        : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-400'
    }`;

  const fieldErr = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Left branding panel (desktop) ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />

        <div className="relative max-w-sm text-center px-8">
          <div className="mb-8">
            <Logo size="xlarge" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            One account, every side of campus
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Shop smart or sell confidently — or both. BIZ BOOK gives you a single account that does it all.
          </p>

          <div className="space-y-2.5 text-left">
            {[
              'Compare prices across verified vendors',
              'Track products and get price alerts',
              'List products and manage sales',
              'Chat directly with buyers or sellers',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 rounded-xl bg-white/80 border border-gray-100 px-4 py-2.5">
                <ShieldCheck size={16} weight="fill" className="text-blue-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ───────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-start justify-center px-5 sm:px-8 py-10 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo size="large" />
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create your account</h2>
            <p className="mt-1.5 text-sm text-gray-500">Free forever. No credit card required.</p>
          </div>

          {serverError && (
            <div role="alert" className="mb-5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start justify-between gap-3">
              <span>{serverError}</span>
              {emailTaken && (
                <Link to="/login" className="text-red-600 underline font-medium whitespace-nowrap flex-shrink-0">
                  Sign in →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input {...register('fullName')} type="text" autoComplete="name" placeholder="Ada Okonkwo" className={input(!!errors.fullName)} />
              {fieldErr(errors.fullName?.message)}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input {...register('email')} type="email" autoComplete="email" placeholder="you@university.edu" className={input(!!errors.email)} />
              {fieldErr(errors.email?.message)}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={input(!!errors.password) + ' pr-12'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password
                ? fieldErr(errors.password.message)
                : <p className="mt-1 text-xs text-gray-400">8+ chars · uppercase · lowercase · number · special</p>
              }
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <div className="relative">
                <select {...register('location')} className={input(!!errors.location) + ' appearance-none bg-white'}>
                  <option value="">Select your state</option>
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <CaretDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {fieldErr(errors.location?.message)}
            </div>

            {/* ── Sell toggle ───────────────────────────────────────────────── */}
            <div className={`rounded-2xl border-2 transition-all duration-200 ${wantToSell ? 'border-blue-400 bg-blue-50/40' : 'border-gray-200 bg-gray-50/50'}`}>
              <label className="flex items-start gap-3.5 p-4 cursor-pointer select-none">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    {...register('wantToSell')}
                    type="checkbox"
                    className="w-4.5 h-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Storefront size={16} weight="fill" className="text-blue-500" />
                    I also want to sell on BIZ BOOK
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Open your Vendor Space now — or do it later from your dashboard</p>
                </div>
              </label>

              {wantToSell && (
                <div className="px-4 pb-4 space-y-3 border-t border-blue-100 pt-4 animate-slide-in-up">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name <span className="text-red-400">*</span></label>
                    <input {...register('businessName')} type="text" placeholder="e.g. Chidi Electronics" className={input(!!errors.businessName)} />
                    {fieldErr(errors.businessName?.message)}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <select {...register('businessCategory')} className={input(!!errors.businessCategory) + ' appearance-none bg-white text-sm'}>
                          <option value="">Select…</option>
                          {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {fieldErr(errors.businessCategory?.message)}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal text-xs">(opt.)</span></label>
                      <input {...register('phone')} type="tel" placeholder="+234 800…" className={input(false)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                wantToSell ? 'Create account & open Vendor Space' : 'Create account'
              )}
            </button>
          </form>

          {/* Divider + login */}
          <div className="mt-8">
            <div className="relative flex items-center">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-xs text-gray-400">Already have an account?</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="mt-4 text-center">
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                Sign in
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            By creating an account you agree to our{' '}
            <button type="button" className="underline hover:text-gray-600">Terms of Service</button>
            {' '}and{' '}
            <button type="button" className="underline hover:text-gray-600">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
}
