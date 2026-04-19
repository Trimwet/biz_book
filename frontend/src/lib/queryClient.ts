import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 60s (matches backend cache TTL)
      staleTime: 60 * 1000,
      // Keep unused data in memory for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry once on failure
      retry: 1,
      // Don't refetch on window focus for product lists (too noisy)
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
