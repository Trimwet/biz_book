import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from './useUser';

type UserHook = { apiRequest: (url: string, opts?: any) => Promise<any>; user: any };

export function useWatchlist(enabled = true) {
  const { apiRequest, user } = useUser() as UserHook;

  return useQuery({
    queryKey: ['shopper', 'watchlist'],
    queryFn: () => apiRequest('/api/shopper/watchlist'),
    enabled: enabled && !!user && user.user_type === 'shopper',
    staleTime: 60 * 1000,
    select: (data: any) => new Set<number>((data?.watchlist ?? []).map((i: any) => i.product_id as number)),
  });
}

export function useToggleWatchlist() {
  const { apiRequest } = useUser() as UserHook;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, inWatchlist }: { productId: number; inWatchlist: boolean }) => {
      if (inWatchlist) {
        return apiRequest(`/api/shopper/watchlist/${productId}`, { method: 'DELETE' });
      }
      return apiRequest('/api/shopper/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
    },
    // Optimistic update
    onMutate: async ({ productId, inWatchlist }) => {
      await qc.cancelQueries({ queryKey: ['shopper', 'watchlist'] });
      const prev = qc.getQueryData<Set<number>>(['shopper', 'watchlist']);
      qc.setQueryData(['shopper', 'watchlist'], (old: Set<number> | undefined) => {
        const next = new Set(old ?? []);
        if (inWatchlist) next.delete(productId);
        else next.add(productId);
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['shopper', 'watchlist'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['shopper', 'watchlist'] });
    },
  });
}
