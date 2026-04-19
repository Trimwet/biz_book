import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiEdit3, FiTrash2, FiEye, FiEyeOff, FiRefreshCw, FiSave, FiX, FiCheck, FiAlertCircle, FiPackage, FiTrendingUp, FiDollarSign, FiBox, FiUpload, FiFilter, FiChevronLeft, FiChevronRight, FiInfo, FiMail } from 'react-icons/fi';
import { Button } from './ui';

interface ProductRow {
  id: number;
  name: string;
  price: number;
  status?: string;
  stock_quantity?: number;
  updated_at?: string;
}

export default function VendorListingsTable() {
  const { apiRequest } = useUser();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [mobileAction, setMobileAction] = useState<string>('');

  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[Number(id)]).map(Number), [selected]);
  const allSelected = useMemo(() => items.length > 0 && items.every(i => selected[i.id]), [items, selected]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/vendor/products?limit=500${status !== 'all' ? `&status=${status}` : ''}`);
      const list = Array.isArray(data?.products) ? data.products : [];
      setItems(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const toggleAll = (checked: boolean) => {
    const next: Record<number, boolean> = {};
    if (checked) items.forEach(i => { next[i.id] = true; });
    setSelected(next);
  };
  const toggleOne = (id: number, checked: boolean) => setSelected(prev => ({ ...prev, [id]: checked }));

  const filtered = useMemo(() => {
    let list = items as any[];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => String(i.name || '').toLowerCase().includes(q));
    }
    if (status !== 'all') {
      list = list.filter(i => (i.status || 'draft') === status);
    }
    return list;
  }, [items, query, status]);

  async function patchStatus(id: number, newStatus: 'draft' | 'published' | 'archived') {
    await apiRequest(`/api/vendor/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    await load();
  }

  async function bulkStatus(newStatus: 'published' | 'draft' | 'archived') {
    if (selectedIds.length === 0) return;
    // Map to legacy bulk action names for compatibility
    const action = newStatus === 'published' ? 'activate' : newStatus === 'draft' ? 'deactivate' : 'deactivate';
    await apiRequest('/api/vendor/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, productIds: selectedIds })
    });
    await load();
    setSelected({});
  }

  async function bulkEditPrice(deltaPct?: number, setPrice?: number) {
    if (selectedIds.length === 0) return;
    await apiRequest('/api/vendor/products/bulk-edit', {
      method: 'POST',
      body: JSON.stringify({ productIds: selectedIds, incPricePct: deltaPct && deltaPct > 0 ? deltaPct : undefined, decPricePct: deltaPct && deltaPct < 0 ? Math.abs(deltaPct) : undefined, setPrice })
    });
    await load();
    setSelected({});
  }

  async function bulkSetStock(stock: number) {
    if (selectedIds.length === 0) return;
    await apiRequest('/api/vendor/products/bulk-edit', {
      method: 'POST',
      body: JSON.stringify({ productIds: selectedIds, setStock: stock })
    });
    await load();
    setSelected({});
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              className="h-10 w-[200px] sm:w-72 border border-gray-200 rounded-xl px-3 pl-10 text-sm flex-shrink-0"
              placeholder="Search listings…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="h-10 border border-gray-200 rounded-xl px-3 text-sm flex-shrink-0" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <div className="text-xs text-gray-500 ml-1">{filtered.length} items</div>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
            <Button onClick={() => bulkStatus('published')} disabled={selectedIds.length === 0} variant="outline" size="sm">Publish</Button>
            <Button onClick={() => bulkStatus('draft')} disabled={selectedIds.length === 0} variant="outline" size="sm">Unpublish</Button>
            <Button onClick={() => bulkStatus('archived')} disabled={selectedIds.length === 0} variant="outline" size="sm">Archive</Button>
        </div>
      </div>

      {/* Card grid (all screens) */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-10">Loading…</div>
        ) : error ? (
          <div className="col-span-full text-center text-red-600 py-10">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">No listings found.</div>
        ) : (
          filtered.map((row) => (
            <div key={row.id} className="group rounded-2xl border border-gray-200 p-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base truncate" title={row.name}>{row.name}</div>
                  <div className="text-gray-700 text-sm mt-1">₦{Number(row.price || 0).toLocaleString()}</div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-[11px] border ${ (row.status || 'draft') === 'published' ? 'bg-green-50 text-green-700 border-green-200' : (row.status === 'archived' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-700 border-gray-200') }`}>
                      {row.status || 'draft'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <input type="checkbox" checked={!!selected[row.id]} onChange={(e) => toggleOne(row.id, e.target.checked)} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <div>Stock: {row.stock_quantity ?? 0}</div>
                <div>{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '-'}</div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button onClick={() => navigate(`/vendor/products`)} size="sm" variant="outline">Edit</Button>
                <Button onClick={() => { const val = prompt('Set price to (NGN):'); if (val) bulkEditPrice(undefined, Number(val)); }} size="sm" variant="outline">Set price</Button>
                <Button onClick={() => { const val = prompt('Set stock to:'); if (val) bulkSetStock(Number(val)); }} size="sm" variant="outline">Set stock</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}