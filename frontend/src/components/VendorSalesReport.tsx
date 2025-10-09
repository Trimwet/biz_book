import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../hooks/useUser';
import config from '../config';
import { Card, Button } from './ui';
import { Wallet, TrendingUp, ShoppingCart, Calendar, Plus, RefreshCw, Download, Search, Filter, X } from 'lucide-react';

/*
 * VendorSalesReport - Clean Professional Design
 * - Uses config.API_BASE_URL and resilient analytics endpoints
 * - Period filter: 7d, 30d, 90d, 1y
 * - Advanced filtering: date range, product search, amount/quantity ranges
 * - Sorting by date, amount, quantity, created date
 * - Pagination for sales history with filter persistence
 * - Collapsible advanced filters UI
 * - Clean, business-focused UI with consistent styling
 * - CSV export and refined empty/error states
 */

function VendorSalesReport() {
  const { user, apiRequest } = useUser();

  // Data state
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);

  // UI/UX state
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Filters and pagination
  const [period, setPeriod] = useState('30d');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Advanced filters
  const [productSearch, setProductSearch] = useState('');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [quantityRange, setQuantityRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('report_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    quantity: '',
    total_amount: '',
    report_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Authorization is handled by apiRequest (auto-injects access token and refreshes on 401)

  useEffect(() => {
    // initial loads
    fetchAnalytics(period);
    fetchSales();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // refetch on filter/pagination changes
    fetchAnalytics(period);
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, page, limit, dateRange.start, dateRange.end, productSearch, amountRange.min, amountRange.max, quantityRange.min, quantityRange.max, sortBy, sortOrder]);

  const fetchSales = async (pageNum = page) => {
    try {
      setLoadingSales(true);
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', String(limit));
      if (dateRange.start) params.set('start_date', dateRange.start);
      if (dateRange.end) params.set('end_date', dateRange.end);
      if (productSearch) params.set('product_search', productSearch);
      if (amountRange.min) params.set('min_amount', amountRange.min);
      if (amountRange.max) params.set('max_amount', amountRange.max);
      if (quantityRange.min) params.set('min_quantity', quantityRange.min);
      if (quantityRange.max) params.set('max_quantity', quantityRange.max);
      params.set('sort_by', sortBy);
      params.set('sort_order', sortOrder);

      const data = await apiRequest(`/api/vendors/sales?${params.toString()}`);
      setSales(Array.isArray(data.sales) ? data.sales : []);

      // Try to infer total pages from pagination
      if (data.pagination && data.pagination.totalPages) {
        setTotalPages(parseInt(data.pagination.totalPages) || 1);
      } else {
        // Fallback: no pagination info, assume single page
        setTotalPages(1);
      }

      setErrors((prev) => ({ ...prev, sales: '' }));
    } catch (error) {
      console.error('Error fetching sales:', error);
      setErrors((prev) => ({ ...prev, sales: error.message }));
      setSales([]);
      setTotalPages(1);
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchAnalytics = async (p) => {
    try {
      setLoadingAnalytics(true);
      // Resilient analytics endpoints
      const paths = [
        `/api/vendors/analytics?period=${p}`,
        `/api/vendor/analytics?period=${p}`,
        `/api/vendors/sales/analytics?period=${p}`,
      ];

      let found = null;
      let lastErr = null;
      for (const url of paths) {
        try {
          found = await apiRequest(url);
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!found) throw new Error(`Failed to fetch analytics: ${lastErr?.message || 'Unknown error'}`);
      setAnalytics(found);
      setErrors((prev) => ({ ...prev, analytics: '' }));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setErrors((prev) => ({ ...prev, analytics: error.message }));
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const data = await apiRequest('/api/vendor/products');
      const list = Array.isArray(data.products) ? data.products : [];
      setProducts(list);

      if (list.length > 0) {
        setErrors((prev) => ({ ...prev, products: '' }));
      } else {
        setErrors((prev) => ({
          ...prev,
          products:
            'No products found in your inventory. You can still submit sales reports by entering product details manually.',
        }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setErrors((prev) => ({
        ...prev,
        products: 'Unable to load products. You can still submit sales reports by entering product details manually.',
      }));
    } finally {
      setProductsLoading(false);
    }
  };

  const numbers = useMemo(() => {
    // Support both { summary: {...} } and flat analytics for demo mode
    const sum = analytics?.summary || analytics || {};
    const totalRevenue = sum.total_revenue || analytics?.total_revenue || 0;
    const totalSales = sum.total_reports || analytics?.total_sales || 0;
    const avgOrder = sum.average_sale_value || analytics?.average_order_value || 0;
    const totalItems = sum.total_quantity_sold || analytics?.total_items || totalSales || 0;
    return { totalRevenue, totalSales, avgOrder, totalItems };
  }, [analytics]);

  const resetForm = () => {
    setFormData({
      product_id: '',
      product_name: '',
      quantity: '',
      total_amount: '',
      report_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const clearFilters = () => {
    setPage(1);
    setDateRange({ start: '', end: '' });
    setProductSearch('');
    setAmountRange({ min: '', max: '' });
    setQuantityRange({ min: '', max: '' });
    setSortBy('report_date');
    setSortOrder('desc');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      if (!formData.quantity || !formData.total_amount || !formData.report_date) {
        throw new Error('Quantity, total amount, and report date are required');
      }
      if (!formData.product_id && !formData.product_name) {
        throw new Error('Please select a product or enter a product name');
      }
      if (Number(formData.quantity) <= 0) {
        throw new Error('Please enter a valid quantity (> 0)');
      }
      if (Number(formData.total_amount) <= 0) {
        throw new Error('Please enter a valid total amount (> 0)');
      }

      let submissionData;
      if (formData.product_id) {
        submissionData = {
          product_id: parseInt(formData.product_id),
          quantity: parseInt(formData.quantity),
          total_amount: parseFloat(formData.total_amount),
          report_date: formData.report_date,
          notes: formData.notes || '',
        };
      } else {
        // Create product first, then submit sale
        try {
          const newProduct = await apiRequest('/api/vendor/products', {
            method: 'POST',
            body: JSON.stringify({
              name: formData.product_name,
              price: parseFloat(formData.total_amount) / parseInt(formData.quantity),
              description: `Product created from sales report on ${formData.report_date}`,
              category: 'General',
            }),
          });

          if (newProduct) {
            submissionData = {
              product_id: newProduct.product?.id || newProduct.id,
              quantity: parseInt(formData.quantity),
              total_amount: parseFloat(formData.total_amount),
              report_date: formData.report_date,
              notes: formData.notes || '',
            };
          } else {
            // Fallback: submit with product_name only
            submissionData = {
              product_name: formData.product_name,
              quantity: parseInt(formData.quantity),
              total_amount: parseFloat(formData.total_amount),
              report_date: formData.report_date,
              notes: formData.notes || '',
            };
          }
        } catch {
          // Network/other error while creating product; fallback to product_name
          submissionData = {
            product_name: formData.product_name,
            quantity: parseInt(formData.quantity),
            total_amount: parseFloat(formData.total_amount),
            report_date: formData.report_date,
            notes: formData.notes || '',
          };
        }
      }

      await apiRequest('/api/vendors/sales', {
        method: 'POST',
        body: JSON.stringify(submissionData),
      });

      // Success
      resetForm();
      setShowForm(false);
      setPage(1);
      await Promise.all([fetchSales(1), fetchAnalytics(period), fetchProducts()]);
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (!sales || sales.length === 0) return;
    const headers = ['date', 'product', 'quantity', 'amount', 'notes'];
    const rows = sales.map((s) => [
      new Date(s.report_date).toISOString().split('T')[0],
      (s.product_name || '').replaceAll(',', ' '),
      s.quantity,
      s.total_amount,
      (s.notes || '').replaceAll(',', ' '),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_reports_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
          <p className="text-gray-600">Please log in to access your sales reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
              <p className="text-gray-600">Track daily sales and monitor performance</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <Calendar className="w-4 h-4 text-gray-600" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 focus:outline-none"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last 1 year</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => {
                    setPage(1);
                    setDateRange((prev) => ({ ...prev, start: e.target.value }));
                  }}
                  className="bg-transparent text-sm text-gray-700 focus:outline-none border-0"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => {
                    setPage(1);
                    setDateRange((prev) => ({ ...prev, end: e.target.value }));
                  }}
                  className="bg-transparent text-sm text-gray-700 focus:outline-none border-0"
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <Search className="w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => {
                    setPage(1);
                    setProductSearch(e.target.value);
                  }}
                  className="bg-transparent text-sm text-gray-700 focus:outline-none min-w-32 border-0"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setPage(1); fetchSales(); fetchAnalytics(period); }}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={!sales || sales.length === 0}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowAdvancedFilters((v) => !v)}>
                <Filter className="w-4 h-4 mr-2" /> {showAdvancedFilters ? 'Hide' : 'Advanced'} Filters
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus className="w-4 h-4 mr-2" /> {showForm ? 'Cancel' : 'Add Sales Report'}
              </Button>
            </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range (₦)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={amountRange.min}
                      onChange={(e) => {
                        setPage(1);
                        setAmountRange((prev) => ({ ...prev, min: e.target.value }));
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={amountRange.max}
                      onChange={(e) => {
                        setPage(1);
                        setAmountRange((prev) => ({ ...prev, max: e.target.value }));
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={quantityRange.min}
                      onChange={(e) => {
                        setPage(1);
                        setQuantityRange((prev) => ({ ...prev, min: e.target.value }));
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={quantityRange.max}
                      onChange={(e) => {
                        setPage(1);
                        setQuantityRange((prev) => ({ ...prev, max: e.target.value }));
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setPage(1);
                        setSortBy(e.target.value);
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="report_date">Date</option>
                      <option value="total_amount">Amount</option>
                      <option value="quantity">Quantity</option>
                      <option value="created_at">Created</option>
                    </select>
                    <select
                      value={sortOrder}
                      onChange={(e) => {
                        setPage(1);
                        setSortOrder(e.target.value);
                      }}
                      className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="desc">↓</option>
                      <option value="asc">↑</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" /> Clear All Filters
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6">
            {Object.entries(errors).map(([key, err]) => (
              err ? (
                <div key={key} className={`border px-4 py-3 rounded mb-2 ${key === 'products' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <strong>{key.charAt(0).toUpperCase() + key.slice(1)} {key === 'products' ? 'Notice' : 'Error'}:</strong> {err}
                </div>
              ) : null
            ))}
          </div>
        )}

        {/* Analytics */}
        {loadingAnalytics ? (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₦{numbers.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{numbers.totalSales}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₦{numbers.avgOrder.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{numbers.totalItems}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Sales Report</h3>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  {products.length > 0 ? (
                    <>
                      <select
                        value={formData.product_id}
                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value, product_name: '' })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={submitting || productsLoading}
                      >
                        <option value="">{productsLoading ? 'Loading products…' : 'Select a product or enter manually below'}</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.price ? `(₦${p.price})` : ''}
                          </option>
                        ))}
                      </select>
                      {!productsLoading && products.length > 0 && (
                        <p className="text-sm text-green-600 mt-1">{products.length} product{products.length !== 1 ? 's' : ''} available</p>
                      )}
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Or enter product name manually:</label>
                        <input
                          type="text"
                          placeholder="Enter new product name"
                          value={formData.product_name || ''}
                          onChange={(e) => setFormData({ ...formData, product_name: e.target.value, product_id: '' })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={submitting}
                        />
                        <p className="text-sm text-blue-600 mt-1">This will create a new product in your inventory</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Enter product name (required)"
                        value={formData.product_name || ''}
                        onChange={(e) => setFormData({ ...formData, product_name: e.target.value, product_id: '' })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={submitting}
                      />
                      <p className="text-sm text-blue-600 mt-1">This will create a new product in your inventory</p>
                    </>
                  )}
                  {productsLoading && <p className="text-sm text-gray-500 mt-1">Loading products…</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₦)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.report_date}
                      onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" variant="success" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Report'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={fetchProducts} disabled={productsLoading}>
                    {productsLoading ? 'Refreshing…' : 'Retry Loading Products'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sales Table */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Sales</h3>
          <div className="mt-4 overflow-x-auto">
            {loadingSales ? (
              <div className="p-6 text-gray-600">Loading sales…</div>
            ) : sales.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No sales reports yet. Add your first report!</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{new Date(sale.report_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{sale.product_name || '-'}</td>
                      <td className="py-3 px-4">{sale.quantity}</td>
                      <td className="py-3 px-4 font-medium">₦{Number(sale.total_amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-600">{sale.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <select
                className="border border-gray-200 rounded px-2 py-1 bg-white"
                value={limit}
                onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value)); }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorSalesReport;
