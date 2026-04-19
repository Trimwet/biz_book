import React, { useEffect, useState } from 'react';
import { getRecommendations, RecommendationItem } from '../api/personalization';
import config from '../config';

interface Props {
  productId?: number;
  title?: string;
}

export default function RecommendedStrip({ productId, title = 'Recommended for you' }: Props) {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getRecommendations(config.API_BASE_URL, { productId, limit: 12 })
      .then(res => {
        if (!active) return;
        setItems(res.items || []);
      })
      .catch(err => {
        if (!active) return;
        setError(err.message || 'Failed to load recommendations');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [productId]);

  if (loading) return <div />;
  if (error || items.length === 0) return <div />;

  return (
    <section aria-label={title} className="mt-8">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(item => (
          <a key={item.id} href={`/product/${item.id}`} className="group block rounded-lg border border-gray-200 hover:border-gray-300 p-3 transition-colors">
            <div className="aspect-square w-full bg-gray-50 overflow-hidden rounded">
              {item.cover_image ? (
                <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-900 line-clamp-2">{item.title}</div>
            {item.price != null && <div className="mt-1 text-sm text-gray-600">₦{Number(item.price).toLocaleString()}</div>}
          </a>
        ))}
      </div>
    </section>
  );
}