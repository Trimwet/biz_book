import { useQuery } from '@tanstack/react-query';
import { useUser } from './useUser';

export interface ShopperDashboardStats {
  money_saved: number;
  comparisons_count: number;
  reviews_count: number;
  watchlist_count: number;
}

export interface ShopperDashboardSummary {
  display_name: string;
  subtitle: string;
  badges: {
    shopper: string;
    presence: string;
  };
  stats: ShopperDashboardStats;
  updated_at: string;
}

export interface ShopperDashboardActivityItem {
  id: string;
  type: 'deal_found' | 'review_posted' | 'watchlist_addition' | string;
  title: string;
  description: string;
  value: string;
  occurred_at: string;
  target_route: string;
  style_token: 'primary' | 'amber' | 'rose' | string;
}

export interface ShopperDashboardPayload {
  summary: ShopperDashboardSummary;
  activity: ShopperDashboardActivityItem[];
}

type UserHook = {
  apiRequest: (url: string, opts?: any) => Promise<any>;
  user: any;
};

export function useShopperDashboard(enabled = true) {
  const { apiRequest, user } = useUser() as UserHook;

  return useQuery({
    queryKey: ['shopper', 'dashboard'],
    queryFn: () => apiRequest('/api/shopper/dashboard') as Promise<ShopperDashboardPayload>,
    enabled: enabled && !!user && user.user_type === 'shopper',
    staleTime: 60 * 1000,
  });
}

export function useShopperDashboardSummary(enabled = true) {
  const query = useShopperDashboard(enabled);
  return {
    ...query,
    data: query.data?.summary,
  };
}

export function useShopperDashboardActivity(enabled = true) {
  const query = useShopperDashboard(enabled);
  return {
    ...query,
    data: query.data?.activity ?? [],
  };
}
