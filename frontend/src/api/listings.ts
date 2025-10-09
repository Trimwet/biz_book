import config from '../config';

export interface ListingVendor {
  name: string;
  location: string;
}

export interface ListingItem {
  id: number;
  title: string;
  description?: string;
  price: number;
  category?: string;
  status?: string;
  created_at?: string;
  vendor: ListingVendor;
  cover_image?: string | null;
}

export interface ListingDetail extends ListingItem {
  images: { id: number; image_url: string; is_primary: boolean; display_order: number }[];
}

export interface ListListingsParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export async function listListings(params: ListListingsParams = {}): Promise<{ items: ListingItem[]; pagination: any }>
{
  const q = new URLSearchParams();
  if (params.query) q.set('query', params.query);
  if (params.category) q.set('category', params.category);
  if (params.minPrice != null) q.set('minPrice', String(params.minPrice));
  if (params.maxPrice != null) q.set('maxPrice', String(params.maxPrice));
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.sortBy) q.set('sortBy', params.sortBy);
  if (params.sortOrder) q.set('sortOrder', params.sortOrder);

  const res = await fetch(`${config.API_BASE_URL}/api/listings?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch listings');
  const data = await res.json();
  const items: ListingItem[] = (data.items || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    price: Number(r.price),
    category: r.category,
    status: r.status,
    created_at: r.created_at,
    vendor: { name: r.vendor?.name ?? r.vendor_name, location: r.vendor?.location ?? r.vendor_location },
    cover_image: r.cover_image ?? null,
  }));
  return { items, pagination: data.pagination };
}

export async function getListing(id: number): Promise<ListingDetail> {
  const res = await fetch(`${config.API_BASE_URL}/api/listings/${id}`);
  if (!res.ok) throw new Error('Failed to fetch listing');
  const r = await res.json();
  return {
    id: r.id,
    title: r.title ?? r.name,
    description: r.description,
    price: Number(r.price),
    category: r.category,
    status: r.status,
    created_at: r.created_at,
    vendor: { name: r.vendor?.name ?? r.vendor_name, location: r.vendor?.location ?? r.vendor_location },
    cover_image: (r.images && r.images.find((i: any) => i.is_primary)?.image_url) || (r.images?.[0]?.image_url ?? null),
    images: r.images || [],
  };
}

export async function createListing(body: { title: string; description?: string; category?: string; price: number; token: string; condition?: string; state?: string }) {
  const res = await fetch(`${config.API_BASE_URL}/api/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${body.token}` },
    body: JSON.stringify({ title: body.title, description: body.description, category: body.category, price: body.price, condition: body.condition })
  });
  if (!res.ok) throw new Error('Failed to create listing');
  return res.json();
}

export async function updateListing(id: number, body: { title?: string; description?: string; category?: string; price?: number; status?: string; token: string }) {
  const res = await fetch(`${config.API_BASE_URL}/api/listings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${body.token}` },
    body: JSON.stringify({ title: body.title, description: body.description, category: body.category, price: body.price, status: body.status })
  });
  if (!res.ok) throw new Error('Failed to update listing');
  return res.json();
}

export async function deleteListing(id: number, token: string) {
  const res = await fetch(`${config.API_BASE_URL}/api/listings/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete listing');
  return res.json();
}