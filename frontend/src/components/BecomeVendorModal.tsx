import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import {
  X,
  Storefront,
  CheckCircle,
  CaretDown,
  ArrowRight,
  Package,
  ChartLineUp,
  ChatCircle,
  ShoppingBag,
} from '@phosphor-icons/react';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Federal Capital Territory',
  'Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara',
  'Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];

const CATEGORIES = [
  'Electronics','Fashion & Clothing','Food & Groceries','Health & Beauty',
  'Home & Garden','Sports & Outdoors','Computers & Laptops','Phones & Tablets',
  'Automotive','Books & Education','Services','Other',
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const benefits = [
  { icon: Package, label: 'List unlimited products' },
  { icon: ChartLineUp, label: 'Sales analytics dashboard' },
  { icon: ChatCircle, label: 'Direct chat with buyers' },
  { icon: ShoppingBag, label: 'Keep your shopper account' },
];

export default function BecomeVendorModal({ onClose, onSuccess }: Props) {
  const { apiRequest, getProfile } = useUser() as any;
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    businessName: '',
    category: '',
    location: '',
    phone: '',
    website: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inputClass = (hasError = false) =>
    `w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 transition-all ${
      hasError ? 'border-red-200 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-400'
    }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName.trim() || !form.category || !form.location) {
      setError('Business name, category and location are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiRequest('/api/auth/upgrade-to-vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      await getProfile();
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    onSuccess();
    navigate('/vendor/dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-scale-in overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-modal-title"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {step === 'form' ? (
          <div>
            {/* Header */}
            <div className="px-6 pt-6 pb-0 sm:px-7 sm:pt-7">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Storefront size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <h2 id="vendor-modal-title" className="text-lg font-bold text-gray-900">
                    Open your Vendor Space
                  </h2>
                  <p className="text-xs text-gray-500">Start selling — keep your shopper access</p>
                </div>
              </div>
            </div>

            {/* Benefits strip */}
            <div className="px-6 sm:px-7 py-4">
              <div className="grid grid-cols-2 gap-2">
                {benefits.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon size={14} className="text-blue-500 flex-shrink-0" weight="fill" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 sm:mx-7 mb-3 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 sm:px-7 sm:pb-7 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Business Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => set('businessName', e.target.value)}
                  placeholder="e.g. Chidi Electronics"
                  className={inputClass(!form.businessName && !!error)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={e => set('category', e.target.value)}
                      className={inputClass(!form.category && !!error) + ' appearance-none'}
                      required
                    >
                      <option value="">Select…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select
                      value={form.location}
                      onChange={e => set('location', e.target.value)}
                      className={inputClass(!form.location && !!error) + ' appearance-none'}
                      required
                    >
                      <option value="">Select…</option>
                      {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(opt.)</span></label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+234 800 000 0000"
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Website <span className="text-gray-400 font-normal">(opt.)</span></label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                    placeholder="https://…"
                    className={inputClass()}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Setting up…
                  </>
                ) : (
                  <>
                    Open Vendor Space
                    <ArrowRight size={16} weight="bold" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ── Success ─────────────────────────────────────────────────────── */
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" weight="fill" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your Vendor Space is ready!</h2>
            <p className="text-sm text-gray-500 mb-6">You can start listing products now. Your shopper access stays active.</p>
            <button
              onClick={handleGoToDashboard}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Go to Vendor Space
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
