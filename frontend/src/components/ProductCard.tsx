import React from 'react';
import { Heart, MapPin, Store, ShoppingCart } from 'lucide-react';

export type ProductImage = {
  id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  category?: string | null;
  // Direct image_url (from search/detail endpoints)
  image_url?: string | null;
  // Images array (from browse endpoint via json_agg)
  images?: ProductImage[] | null;
  vendor_name?: string | null;
  vendor_location?: string | null;
  created_at?: string | null;
  status?: string | null;
};

type Props = {
  product: Product;
  onClick?: (id: number) => void;
  inWatchlist?: boolean;
  onToggleWatch?: (id: number) => void;
  onAddToCart?: (id: number) => void;
};

/**
 * Resolves the best available image URL from a product.
 * Browse API returns `images[]` via json_agg; search/detail return `image_url` directly.
 */
function resolveImageUrl(product: Product): string | null {
  // Prefer primary image from images array (browse endpoint)
  if (product.images && product.images.length > 0) {
    const primary = product.images.find((img) => img.is_primary);
    return (primary ?? product.images[0]).image_url ?? null;
  }
  // Fallback to direct image_url (search / detail endpoints)
  return product.image_url ?? null;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

export default function ProductCard({ product, onClick, inWatchlist, onToggleWatch, onAddToCart }: Props) {
  const imageUrl = resolveImageUrl(product);

  return (
    <div
      className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:border-primary-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
      onClick={() => onClick?.(product.id)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* Subtle placeholder that matches the design */}
            <div className="flex flex-col items-center gap-2 text-neutral-300">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">No image</span>
            </div>
          </div>
        )}

        {/* Category badge */}
        {product.category && (
          <div className="absolute top-2 left-2">
            <span className="inline-block px-2 py-0.5 bg-white/90 backdrop-blur-sm text-neutral-600 text-[10px] font-semibold uppercase tracking-wide rounded-full border border-neutral-200/60 shadow-sm">
              {product.category}
            </span>
          </div>
        )}

        {/* Watchlist button */}
        {onToggleWatch && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWatch(product.id); }}
            className={`absolute top-2 right-2 inline-flex items-center justify-center h-8 w-8 rounded-full border bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-150
              ${inWatchlist
                ? 'border-red-200 text-red-500 hover:bg-red-50'
                : 'border-neutral-200 text-neutral-400 hover:text-red-400 hover:border-red-200 hover:bg-white'
              }`}
            aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Heart className="w-3.5 h-3.5" fill={inWatchlist ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* Details */}
      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-neutral-900 font-semibold text-sm leading-snug line-clamp-2 mb-1 flex-1">
          {product.name}
        </p>

        <div className="flex items-end justify-between mt-1">
          <p className="text-primary-600 font-bold text-base">
            {formatPrice(product.price || 0)}
          </p>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (onAddToCart) onAddToCart(product.id); 
            }}
            className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-900 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2">
          {product.vendor_name && (
            <div className="flex items-center gap-1 text-neutral-500 min-w-0">
              <Store className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs truncate">{product.vendor_name}</span>
            </div>
          )}
          {product.vendor_location && (
            <div className="flex items-center gap-1 text-neutral-400 flex-shrink-0">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{product.vendor_location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
