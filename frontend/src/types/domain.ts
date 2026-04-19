export type ISODate = string;

export type ProductStatus = 'draft' | 'published' | 'archived' | 'active' | 'inactive' | null;

export interface Product {
  id: number;
  vendor_id?: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  specifications?: Record<string, any> | null;
  stock_quantity?: number;
  status?: ProductStatus;
  sku?: string | null;
  state?: string | null;
  city?: string | null;
  created_at?: ISODate | null;
  updated_at?: ISODate | null;
}

export interface ListingItem {
  id: number;
  product_id?: number | null;
  title: string;
  description?: string | null;
  category?: string | null;
  price: number;
  status?: 'active' | 'paused' | 'archived' | 'draft' | 'published' | null;
  location_lat?: number | null;
  location_lng?: number | null;
  state?: string | null;
  city?: string | null;
  created_at?: ISODate | null;
}

export interface SalesReport {
  id: number;
  vendor_id: number;
  product_id?: number | null;
  product_name?: string | null;
  quantity: number;
  total_amount: number;
  report_date?: string | null;
  notes?: string | null;
  created_at?: ISODate | null;
}

export interface AIFlags {
  product_id: number;
  risk_score: number; // 0..100
  flags: string[]; // e.g. ['keyword:fake', 'price:too_low_vs_category']
  updated_at?: ISODate | null;
}
