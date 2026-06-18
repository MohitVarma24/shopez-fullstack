import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../lib/api';
import { Product, Order } from '../types';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { 
  Plus, Edit2, Trash2, Calendar, FileText, ShoppingBag, 
  Hash, Mail, AlertTriangle, ShieldCheck, 
  X, Check, Folder, Info, Tag
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { token, user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Active dashboard tabs
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  // Products state lists
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Orders state lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Form states (Add/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    countInStock: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Protection Guard
  useEffect(() => {
    if (!authLoading) {
      if (!token) {
        navigate('/login', { state: { from: { pathname: '/admin' } } });
      } else if (!isAdmin) {
        // Logged in but not admin role
        navigate('/');
      }
    }
  }, [token, isAdmin, authLoading, navigate]);

  // Load products catalog
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await API.get('/api/products');
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else if (res.data && Array.isArray(res.data.products)) {
        setProducts(res.data.products);
      } else {
        setProducts(res.data || []);
      }
      setProductsError(null);
    } catch (err: any) {
      console.error('Error listing dashboard products:', err);
      setProductsError('Failed to synchronize global product listings.');
    } finally {
      setProductsLoading(false);
    }
  };

  // Load all user orders
  const loadAllOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await API.get('/api/orders');
      if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else if (res.data && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      } else {
        setOrders(res.data || []);
      }
      setOrdersError(null);
    } catch (err: any) {
      console.error('Error listing global orders:', err);
      setOrdersError('Failed to retrieve full purchase logs from standard API.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (token && isAdmin) {
      loadProducts();
      loadAllOrders();
    }
  }, [token, isAdmin]);

  // Trigger form clear
  const openAddForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      imageUrl: '',
      countInStock: '10'
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const openEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      description: prod.description || '',
      price: prod.price ? prod.price.toString() : '',
      category: prod.category || '',
      imageUrl: prod.imageUrl || prod.image || '',
      countInStock: prod.countInStock || prod.countInStock === 0 ? prod.countInStock.toString() : '10'
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      imageUrl: formData.imageUrl || undefined,
      image: formData.imageUrl || undefined, // Support older backends looking for image instead of imageUrl
      countInStock: parseInt(formData.countInStock)
    };

    try {
      if (editingProduct) {
        // Edit Product: PUT /api/products/:id
        const pId = editingProduct._id || editingProduct.id;
        await API.put(`/api/products/${pId}`, payload);
        setFormSuccess('Successfully updated product specifications!');
      } else {
        // Add Product: POST /api/products
        await API.post('/api/products', payload);
        setFormSuccess('Successfully appended new product to the catalog!');
      }

      // Refresh listings
      await loadProducts();
      setTimeout(() => {
        setIsFormOpen(false);
      }, 1200);
    } catch (err: any) {
      console.error('Error submitting product modifications:', err);
      setFormError(err.response?.data?.message || 'Could not register alterations on database.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm('Are you absolutely sure you want to remove this product from index?')) {
      return;
    }

    try {
      // DELETE /api/products/:id
      await API.delete(`/api/products/${prodId}`);
      // Refresh listings
      loadProducts();
    } catch (err: any) {
      console.error('Error removing products index:', err);
      alert(err.response?.data?.message || 'Removal request failed. Please check permissions.');
    }
  };

  // Helper payment or deliver order statuses triggers
  const handleDeliverOrder = async (orderId: string) => {
    try {
      // Try to mark delivered if endpoint fits, otherwise handle success state
      // Most backends have PUT /api/orders/:id/deliver
      await API.put(`/api/orders/${orderId}/deliver`);
      loadAllOrders();
    } catch (err: any) {
      console.error('Delivery status update issue (expected if backend lacks precise endpoints):', err);
      alert(err.response?.data?.message || 'Could not update delivery status directly. Feature may be restricted on backend.');
    }
  };

  // Check login authentication loaders
  if (authLoading || (!token && !user)) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-xs text-slate-400 mt-3 italic">Authorizing Admin Console credentials...</p>
      </div>
    );
  }

  return (
    <div className="pb-16 flex flex-col gap-8">
      {/* Editorial Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest leading-none">
            <ShieldCheck className="h-4 w-4" />
            <span>Admin Console Security</span>
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-slate-950 tracking-tight">
            ShopEZ Executive Panel
          </h1>
          <p className="text-sm text-slate-500 font-sans">
            Logged in as <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.email})
          </p>
        </div>

        {/* Dashboard Quick Switch Tabs */}
        <div className="inline-flex self-start border border-slate-200 rounded-2xl bg-slate-50 p-1 font-sans">
          <button
            onClick={() => setActiveTab('products')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider ${
              activeTab === 'products'
                ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-100'
                : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Products Catalog
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider ${
              activeTab === 'orders'
                ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-100'
                : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            All Purchases
          </button>
        </div>
      </div>

      {/* Forms Drawer overlay modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-250 p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Close buttons */}
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 border border-slate-150 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-slate-950 tracking-tight border-b border-slate-100 pb-3 mb-6">
              {editingProduct ? 'Modify Product Specifications' : 'Add New Retail Product'}
            </h3>

            {formError && (
              <div className="mb-4 flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 flex gap-2.5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs font-semibold text-teal-850">
                <Check className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 text-xs font-sans">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600 uppercase tracking-wider">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ergonomic Bluetooth Keyboards"
                  className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-600 uppercase tracking-wider">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="29.99"
                    className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-600 uppercase tracking-wider">Units in Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.countInStock}
                    onChange={(e) => setFormData({ ...formData, countInStock: e.target.value })}
                    placeholder="15"
                    className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-600 uppercase tracking-wider">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Electronics, Clothing, Accessories..."
                    className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-600 uppercase tracking-wider">Image / Thumbnail URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600 uppercase tracking-wider">Comprehensive Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summarize product specification details and core value proposals..."
                  className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="mt-4 flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition-all cursor-pointer"
              >
                <span>{formLoading ? 'Submitting configurations...' : editingProduct ? 'Save Alterations' : 'Publish Product'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB View: Product Catalogue Management */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">Active Product Index</h2>
              <p className="text-xs text-slate-500 mt-0.5">Publish, tweak details, and modify inventory metrics.</p>
            </div>
            
            <button
              onClick={openAddForm}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow-lg hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          </div>

          {productsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : productsError ? (
            <div className="rounded-xl border border-rose-250 bg-rose-50 text-slate-800 p-6 text-center text-sm font-semibold">
              {productsError}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center rounded-3xl border border-dashed border-slate-250 py-16 px-4 bg-white">
              <ShoppingBag className="h-10 w-10 mx-auto text-slate-400 mb-2" />
              <h4 className="font-bold text-slate-800">Your Catalogue is Empty</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">No products catalog found on database. Append your first item.</p>
            </div>
          ) : (
            /* Desktop/Tablet Table rendering */
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-55/60 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-sans">
                    <th className="p-4 sm:p-5">Product Details</th>
                    <th className="p-4 sm:p-5">Category</th>
                    <th className="p-4 sm:p-5">Price</th>
                    <th className="p-4 sm:p-5">Stock Level</th>
                    <th className="p-4 sm:p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-sans text-slate-700 font-medium">
                  {products.map((prod) => {
                    const id = prod._id || prod.id || '';
                    const stockVal = prod.countInStock !== undefined ? prod.countInStock : (prod.stock !== undefined ? prod.stock : 0);
                    const hasStock = stockVal > 0;
                    const fallbackImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
                    const listImage = prod.imageUrl || prod.image || fallbackImg;

                    return (
                      <tr key={id} className="hover:bg-slate-50/40">
                        {/* Title details */}
                        <td className="p-4 sm:p-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-50 border border-slate-100">
                              <img
                                src={listImage}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = fallbackImg;
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">{prod.name}</p>
                              <p className="text-[9px] text-slate-450 font-mono truncate max-w-36 select-all">{id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4 sm:p-5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 capitalize">
                            <Folder className="h-3 w-3 text-slate-450" />
                            {prod.category || 'Uncategorized'}
                          </span>
                        </td>

                        {/* Unit Price */}
                        <td className="p-4 sm:p-5 font-bold font-mono text-slate-900">
                          ₹{(prod.price || 0).toFixed(2)}
                        </td>

                        {/* Stock metrics */}
                        <td className="p-4 sm:p-5 font-semibold">
                          {hasStock ? (
                            <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 text-emerald-800 px-2 py-0.5 text-xs font-bold">
                              {stockVal} Units
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded bg-rose-50 text-rose-800 px-2 py-0.5 text-xs font-bold">
                              Sold Out
                            </span>
                          )}
                        </td>

                        {/* Executions */}
                        <td className="p-4 sm:p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditForm(prod)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-150 shadow-xs transition-colors"
                              title="Edit product"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-150 shadow-xs transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB View: Purchases Audit trail mapping */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">Purchase Transactions Audit</h2>
            <p className="text-xs text-slate-500 mt-0.5">Review, monitor, and update global user order sheets.</p>
          </div>

          {ordersLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : ordersError ? (
            <div className="rounded-xl border border-rose-250 bg-rose-50 text-slate-800 p-6 text-center text-sm font-semibold">
              {ordersError}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center rounded-3xl border border-dashed border-slate-250 py-16 px-4 bg-white">
              <FileText className="h-10 w-10 mx-auto text-slate-400 mb-2" />
              <h4 className="font-bold text-slate-800">Your Platform History is Dry</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">No orders have been recorded on this ShopEZ deployment yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-55/60 border-b border-slate-200 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-sans">
                    <th className="p-4 sm:p-5">Order ID</th>
                    <th className="p-4 sm:p-5">Buyer</th>
                    <th className="p-4 sm:p-5">Total price</th>
                    <th className="p-4 sm:p-5">Status state</th>
                    <th className="p-4 sm:p-5 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-sans text-slate-700 font-medium">
                  {orders.map((ord, iD) => {
                    const ordId = ord._id || ord.id || `LOG-${iD}`;
                    const buyerName = ord.user?.name || 'Customer';
                    const buyerEmail = ord.user?.email || 'N/A';

                    return (
                      <tr key={ordId} className="hover:bg-slate-50/40">
                        {/* Reference lines */}
                        <td className="p-4 sm:p-5 font-mono text-xs font-bold text-slate-900 select-all">
                          {ordId}
                        </td>

                        {/* Customer Info */}
                        <td className="p-4 sm:p-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 leading-snug">{buyerName}</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 leading-none mt-1">
                              <Mail className="h-3 w-3 shrink-0" />
                              {buyerEmail}
                            </span>
                          </div>
                        </td>

                        {/* Charge prices */}
                        <td className="p-4 sm:p-5 font-bold font-mono text-slate-900">
                          ₹{(ord.totalPrice || 0).toFixed(2)}
                        </td>

                        {/* Badge layouts */}
                        <td className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                            <OrderStatusBadge type="paid" value={ord.isPaid} />
                            <OrderStatusBadge type="delivered" value={ord.isDelivered} />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 sm:p-5 text-right">
                          {ord.isPaid && !ord.isDelivered ? (
                            <button
                              onClick={() => handleDeliverOrder(ordId)}
                              className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-150 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Dispatch</span>
                            </button>
                          ) : ord.isDelivered ? (
                            <span className="text-xs text-slate-400 font-medium italic">Dispatched</span>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-amber-600 bg-amber-50 rounded-lg">
                              <Info className="h-3.5 w-3.5" />
                              <span>Awaiting Pay</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
