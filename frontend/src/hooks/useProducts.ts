import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import config from '../config';

const API = config.API_BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  status: string;
  stock_quantity: number;
  vendor_name?: string;
  vendor_location?: string;
  vendor_id?: number;
  images?: ProductImage[];
  created_at: string;
  updated_at?: string;
}

export interface BrowseFilters {
  category?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
}

export interface SearchFilters {
  q: string;
  category?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchBrowsePage(
  filters: BrowseFilters,
  page: number
): Promise<{ products: Product[]; pagination: any }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(filters.limit ?? 12),
    sortBy: filters.sortBy ?? 'created_at',
    sortOrder: filters.sortOrder ?? 'DESC',
    ...(filters.category ? { category: filters.category } : {}),
  });
  const res = await fetch(`${API}/api/products/browse?${params}`);
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

async function fetchProductSearch(filters: SearchFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const res = await fetch(`${API}/api/products/search?${params}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

async function fetchProductDetail(id: number) {
  const res = await fetch(`${API}/api/products/${id}`);
  if (!res.ok) throw new Error('Product not found');
  return res.json();
}

async function fetchCategories() {
  const res = await fetch(`${API}/api/products/categories`);
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json();
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Infinite scroll hook for the product browse page.
 * Replaces the manual useEffect + page state pattern.
 */
export function useProductsBrowse(filters: BrowseFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['products', 'browse', filters],
    queryFn: ({ pageParam = 1 }) => fetchBrowsePage(filters, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage.pagination;
      if (!p) return undefined;
      const hasNext = p.has_next ?? (p.current_page < p.total_pages);
      return hasNext ? (p.current_page ?? 1) + 1 : undefined;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Standard paginated search hook.
 */
export function useProductSearch(filters: SearchFilters, enabled = true) {
  return useQuery({
    queryKey: ['products', 'search', filters],
    queryFn: () => fetchProductSearch(filters),
    enabled: enabled && filters.q.trim().length >= 2,
    staleTime: 60 * 1000,
  });
}

/**
 * Single product detail hook.
 */
export function useProductDetail(id: number | null) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: () => fetchProductDetail(id!),
    enabled: id != null && id > 0,
    staleTime: 120 * 1000,
  });
}

/**
 * Categories hook.
 */
export function useCategories() {
  return useQuery({
    queryKey: ['products', 'categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}
