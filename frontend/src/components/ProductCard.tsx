import React from 'react';
import { Heart } from 'lucide-react';

type Product = {
  id: number;
  name: string;
  price: number;
  category?: string | null;
  image_url?: string | null;
  vendor_name?: string | null;
  vendor_location?: string | null;
  created_at?: string | null;
};

type Props = {
  product: Product;
  onClick?: (id: number) => void;
  inWatchlist?: boolean;
  onToggleWatch?: (id: number) => void;
};

export default function ProductCard({ product, onClick, inWatchlist, onToggleWatch }: Props) {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-colors cursor-pointer"
      onClick={() => onClick?.(product.id)}
    >
      <div className="relative">
        <div className="aspect-[4/3] bg-gray-100">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">{/* placeholder */}
              <div className="h-8 w-8 rounded-md bg-gray-200" />
            </div>
          )}
        </div>
        {/* Watchlist (minimal icon button) */}
        {onToggleWatch && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWatch(product.id); }}
            className={`absolute top-2 right-2 inline-flex items-center justify-center h-8 w-8 rounded-full border bg-white text-gray-600 hover:bg-gray-50 ${inWatchlist ? 'border-red-300 text-red-600' : 'border-gray-200'}`}
            aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Heart className="w-4 h-4" fill={inWatchlist ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="p-3.5 sm:p-4">
        {product.category && (
          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1 line-clamp-1">{product.category}</div>
        )}
        <div className="text-gray-900 font-medium text-sm md:text-[15px] leading-snug line-clamp-2">
          {product.name}
        </div>
        <div className="mt-1 text-[15px] font-semibold text-gray-900">{formatPrice(product.price || 0)}</div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 gap-2">
          <div className="truncate" title={product.vendor_name || undefined}>{product.vendor_name || 'Vendor'}</div>
          <div className="truncate text-right" title={product.vendor_location || undefined}>{product.vendor_location || 'Location'}</div>
        </div>
      </div>
    </div>
  );
}
