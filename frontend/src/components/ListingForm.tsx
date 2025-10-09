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
      await createListing({ title, description, category, price: Number(price), token: user.token });
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