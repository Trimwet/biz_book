export async function postEvent(baseUrl: string, payload: { type: string; productId?: number; metadata?: any }) {
  const res = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to record event');
  return res.json();
}

export type RecommendationItem = {
  id: number;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  cover_image?: string | null;
};

export async function getRecommendations(baseUrl: string, params: { productId?: number; limit?: number }) {
  const usp = new URLSearchParams();
  if (params.productId) usp.set('productId', String(params.productId));
  if (params.limit) usp.set('limit', String(params.limit));
  const res = await fetch(`${baseUrl}/api/recommendations?${usp.toString()}`, {
    method: 'GET',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json() as Promise<{ items: RecommendationItem[] }>;
}