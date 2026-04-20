import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import {
  MagnifyingGlass,
  ArrowRight,
  ShieldCheck,
  Storefront,
  ChatCircle,
  TrendUp,
  BookOpen,
  DeviceMobile,
  TShirt,
  Hamburger,
  Laptop,
  Wrench,
} from '@phosphor-icons/react';
import AnimatedCounter from './AnimatedCounter';
import Footer from './Footer';

/* ── Category data ─────────────────────────────────────────────────────────── */
const categories = [
  { label: 'Textbooks', icon: BookOpen },
  { label: 'Gadgets', icon: DeviceMobile },
  { label: 'Fashion', icon: TShirt },
  { label: 'Food', icon: Hamburger },
  { label: 'Laptops', icon: Laptop },
  { label: 'Services', icon: Wrench },
];

/* ── Hero ───────────────────────────────────────────────────────────────────── */
function Hero() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [q, setQ] = useState('');

  const go = () => {
    const t = q.trim();
    navigate(t ? `/search?query=${encodeURIComponent(t)}` : '/search');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 to-white">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-blue-50/60 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-5 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-700">Your campus marketplace</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-5">
            Shop close.{' '}
            <span className="text-blue-600">Sell smart.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
            The marketplace built for university communities. Find what you need from
            verified vendors right on your campus.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <button
              onClick={() =>
                navigate(
                  user
                    ? user.user_type === 'vendor'
                      ? '/vendor/dashboard'
                      : '/shopper/dashboard'
                    : '/signup'
                )
              }
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20 text-[15px]"
            >
              {user ? 'Go to Dashboard' : 'Get Started — it\'s free'}
              <ArrowRight size={18} weight="bold" />
            </button>
            <button
              onClick={() => navigate('/browse')}
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-7 py-3.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-[15px]"
            >
              Browse Marketplace
            </button>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 focus-within:border-blue-300 focus-within:shadow-md focus-within:shadow-blue-100">
              <MagnifyingGlass className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                className="flex-1 outline-none px-3 py-1.5 text-gray-900 placeholder-gray-400 bg-transparent text-[15px]"
                placeholder="Search products, vendors…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && go()}
              />
              <button
                onClick={go}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Categories ────────────────────────────────────────────────────────────── */
function Categories() {
  const navigate = useNavigate();
  return (
    <section className="py-10 bg-white">
      <div className="max-w-5xl mx-auto px-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Popular on campus</h2>
          <button
            onClick={() => navigate('/browse')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {categories.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => navigate(`/search?query=${encodeURIComponent(label)}`)}
              className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-blue-50 hover:border-blue-100 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-gray-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:border-blue-200 transition-all duration-200">
                <Icon size={22} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700 transition-colors">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Stats ─────────────────────────────────────────────────────────────────── */
function Stats() {
  return (
    <section className="py-10 bg-gray-50/70">
      <div className="max-w-5xl mx-auto px-5">
        <div className="grid grid-cols-3 gap-6">
          {[
            { value: 5000, label: 'Products', sub: 'Verified listings' },
            { value: 1200, label: 'Vendors', sub: 'Trusted sellers' },
            { value: 24000, label: 'Reviews', sub: 'Real feedback' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-0.5">
                <AnimatedCounter target={s.value} duration={2000} />+
              </div>
              <p className="text-sm font-medium text-gray-800">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Value Proposition ─────────────────────────────────────────────────────── */
function ValueProp() {
  const navigate = useNavigate();
  const { user } = useUser();

  const cards = [
    {
      title: 'For Shoppers',
      desc: 'Compare prices, read real reviews, set price alerts, and find the best deals from vendors near you.',
      features: ['Smart price comparison', 'Verified reviews', 'Price alerts & watchlist', 'Direct vendor chat'],
      cta: 'Join as Shopper',
      ctaPath: '/signup/shopper',
      accent: 'blue',
      icon: MagnifyingGlass,
    },
    {
      title: 'For Vendors',
      desc: 'Open your Vendor Space and reach students actively looking to buy. Manage listings, track sales, and grow.',
      features: ['Free product listings', 'Sales analytics', 'Customer messaging', 'Vendor Space profile'],
      cta: 'Open your Vendor Space',
      ctaPath: '/signup/vendor',
      accent: 'green',
      icon: Storefront,
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Built for campus life
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Whether you're shopping smart or building your business, we've got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((c) => {
            const isBlue = c.accent === 'blue';
            return (
              <div
                key={c.title}
                className={`p-6 sm:p-8 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                  isBlue
                    ? 'bg-blue-50/40 border-blue-100 hover:border-blue-200'
                    : 'bg-green-50/40 border-green-100 hover:border-green-200'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                    isBlue ? 'bg-blue-600' : 'bg-green-600'
                  }`}
                >
                  <c.icon size={24} className="text-white" weight="fill" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{c.desc}</p>

                <ul className="space-y-2 mb-6">
                  {c.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <ShieldCheck
                        size={16}
                        weight="fill"
                        className={isBlue ? 'text-blue-500' : 'text-green-500'}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {!user && (
                  <button
                    onClick={() => navigate(c.ctaPath)}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isBlue
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {c.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ──────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Discover',
      desc: 'Browse verified products or search for exactly what you need with smart filters.',
      icon: MagnifyingGlass,
    },
    {
      num: '02',
      title: 'Compare',
      desc: 'See prices across vendors, read reviews, and track price changes over time.',
      icon: TrendUp,
    },
    {
      num: '03',
      title: 'Connect',
      desc: 'Chat directly with vendors, ask questions, and build trusted relationships.',
      icon: ChatCircle,
    },
  ];

  return (
    <section className="py-16 bg-gray-50/70">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            How it works
          </h2>
          <p className="text-gray-500">Three steps to smarter shopping</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.num}
              className="relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              <span className="text-xs font-bold text-blue-400 tracking-widest">{s.num}</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mt-3 mb-4">
                <s.icon size={20} className="text-blue-600" weight="duotone" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ─────────────────────────────────────────────────────────────── */
function FinalCTA() {
  const navigate = useNavigate();
  const { user } = useUser();

  if (user) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Ready to join your campus marketplace?
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Create your free account and start shopping or selling today.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20"
          >
            Get Started Free
            <ArrowRight size={18} weight="bold" />
          </button>
          <button
            onClick={() => navigate('/browse')}
            className="inline-flex items-center justify-center bg-white border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
          >
            Explore Products
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Main Landing ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Categories />
      <Stats />
      <ValueProp />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </div>
  );
}