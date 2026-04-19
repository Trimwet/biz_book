import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from './useUser';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VendorProductFilters {
  search?: string;
  category?: string;
  status?: string;
  state?: string;
  city?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  limit?: number;
}

type UserHook = { apiRequest: (url: string, opts?: any) => Promise<any> };

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated vendor's products with filters + pagination.
 */
export function useVendorProducts(filters: VendorProductFilters = {}) {
  const { apiRequest } = useUser() as UserHook;

  return useQuery({
    queryKey: ['vendor', 'products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
      });
      return apiRequest(`/api/vendor/products?${params.toString()}`);
    },
    staleTime: 30 * 1000, // vendor data refreshes faster (30s)
  });
}

/**
 * Create a new product (multipart/form-data).
 * Invalidates vendor product list on success.
 */
export function useCreateProduct() {
  const { apiRequest } = useUser() as UserHook;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiRequest('/api/vendor/products', { method: 'POST', body: formData }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor', 'products'] });
      qc.invalidateQueries({ queryKey: ['products', 'browse'] });
      qc.invalidateQueries({ queryKey: ['products', 'categories'] });
    },
  });
}

/**
 * Update an existing product.
 * Invalidates vendor list + product detail cache on success.
 */
export function useUpdateProduct(productId: number) {
  const { apiRequest } = useUser() as UserHook;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiRequest(`/api/vendor/products/${productId}`, { method: 'PUT', body: formData }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor', 'products'] });
      qc.invalidateQueries({ queryKey: ['products', 'detail', productId] });
      qc.invalidateQueries({ queryKey: ['products', 'browse'] });
    },
  });
}

/**
 * Delete a product.
 */
export function useDeleteProduct() {
  const { apiRequest } = useUser() as UserHook;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) =>
      apiRequest(`/api/vendor/products/${productId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor', 'products'] });
      qc.invalidateQueries({ queryKey: ['products', 'browse'] });
    },
  });
}

/**
 * Toggle product status (draft / published / archived).
 */
export function useUpdateProductStatus() {
  const { apiRequest } = useUser() as UserHook;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, status }: { productId: number; status: string }) =>
      apiRequest(`/api/vendor/products/${productId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: ['vendor', 'products'] });
      qc.invalidateQueries({ queryKey: ['products', 'detail', productId] });
      qc.invalidateQueries({ queryKey: ['products', 'browse'] });
    },
  });
}

/**
 * Bulk action on multiple products.
 */
export function useBulkProductAction() {
  const { apiRequest } = useUser() as UserHook;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ action, productIds }: { action: string; productIds: number[] }) =>
      apiRequest('/api/vendor/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, productIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor', 'products'] });
      qc.invalidateQueries({ queryKey: ['products', 'browse'] });
    },
  });
}
