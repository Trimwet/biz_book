import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { X, Store, CheckCircle } from 'lucide-react';

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
      // Refresh user profile so can_sell is updated in context
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-scale-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Start Selling on BIZ BOOK</h2>
                <p className="text-sm text-neutral-500">Unlock vendor capabilities — keep your shopper account too</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">What you get</p>
              <ul className="space-y-1.5">
                {['List unlimited products', 'Sales analytics dashboard', 'Direct chat with buyers', 'Keep your shopper account'].map(b => (
                  <li key={b} className="flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Business Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => set('businessName', e.target.value)}
                  placeholder="e.g. Chidi Electronics"
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-400 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Category <span className="text-red-500">*</span></label>
                  <select
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-400 focus:outline-none transition-all bg-white"
                    required
                  >
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">State <span className="text-red-500">*</span></label>
                  <select
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-400 focus:outline-none transition-all bg-white"
                    required
                  >
                    <option value="">Select…</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Phone <span className="text-neutral-400 font-normal">(optional)</span></label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-400 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Website <span className="text-neutral-400 font-normal">(optional)</span></label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                    placeholder="https://…"
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/30 focus:border-green-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Setting up your store…
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4" />
                    Unlock Vendor Dashboard
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">You're a vendor now!</h2>
            <p className="text-neutral-500 mb-6">Your vendor dashboard is ready. You can still browse and shop as usual.</p>
            <button
              onClick={handleGoToDashboard}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors duration-150"
            >
              Go to Vendor Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
