import React, { useState } from 'react';
import { createListing } from '../api/listings';
import { useUser } from '../hooks/useUser';

const ListingForm: React.FC = () => {
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [condition, setCondition] = useState('');
  const [state, setState] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) {
      setMessage('Please login to create a listing');
      return;
    }
    if (!title || !price) {
      setMessage('Title and price are required');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await createListing({ title, description, category, price: Number(price), token: user.token, condition, state });
      setMessage('Listing created successfully');
      setTitle(''); setPrice(''); setCategory(''); setDescription('');
    } catch (err: any) {
      setMessage(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message && <div className="text-sm text-gray-700">{message}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Price</label>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Condition</label>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2">
          <option value="">Select</option>
          <option value="new">New</option>
          <option value="like_new">Like new</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">State (Nigeria)</label>
        <select value={state} onChange={(e) => setState(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2">
          <option value="">Select State</option>
          <option value="Lagos">Lagos</option>
          <option value="Abuja">Abuja (FCT)</option>
          <option value="Rivers">Rivers</option>
          <option value="Oyo">Oyo</option>
          <option value="Kano">Kano</option>
          <option value="Ogun">Ogun</option>
          <option value="Kaduna">Kaduna</option>
          <option value="Anambra">Anambra</option>
          <option value="Enugu">Enugu</option>
          <option value="Delta">Delta</option>
          <option value="Edo">Edo</option>
          <option value="Imo">Imo</option>
          <option value="Akwa Ibom">Akwa Ibom</option>
          <option value="Plateau">Plateau</option>
          <option value="Others">Other State</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" rows={4} />
      </div>
      <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
        {loading ? 'Saving...' : 'Create Listing'}
      </button>
    </form>
  );
};

export default ListingForm;