import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { ShoppingBag, ChevronDown, ChevronUp, Calendar, Hash, IndianRupee, PackageOpen } from 'lucide-react';

const getStatusBadge = (status?: string) => {
  const s = (status || 'pending').toLowerCase();
  let bg = 'bg-slate-100 text-slate-700 border border-slate-200';
  let dot = 'bg-slate-400';
  let label = 'Pending';

  if (s === 'pending') {
    bg = 'bg-amber-50 text-amber-800 border border-amber-200';
    dot = 'bg-amber-500';
    label = 'Pending';
  } else if (s === 'processing') {
    bg = 'bg-blue-50 text-blue-800 border border-blue-200';
    dot = 'bg-blue-500';
    label = 'Processing';
  } else if (s === 'shipped') {
    bg = 'bg-indigo-50 text-indigo-800 border-indigo-200';
    dot = 'bg-indigo-500';
    label = 'Shipped';
  } else if (s === 'delivered') {
    bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dot = 'bg-emerald-500';
    label = 'Delivered';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};

const getPaymentLabel = (method?: string) => {
  if (!method) return 'Cash on Delivery';
  const m = method.toLowerCase();
  if (m === 'cod') return 'Cash on Delivery';
  if (m === 'online') return 'Online Payment';
  return method;
};

const renderAddress = (address: any) => {
  if (typeof address === 'object' && address !== null) {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No shipping address provided.';
  }
  return address || 'No shipping address provided.';
};

export const MyOrders: React.FC = () => {
  const { token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!token && !authLoading) {
      navigate('/login', { state: { from: { pathname: '/myorders' } } });
      return;
    }

    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        const res = await API.get('/api/orders/myorders');
        
        if (Array.isArray(res.data)) {
          setOrders(res.data);
        } else if (res.data && Array.isArray(res.data.orders)) {
          setOrders(res.data.orders);
        } else {
          setOrders(res.data || []);
        }
        setError(null);
      } catch (err: any) {
        console.error('Error fetching my orders:', err);
        setError(
          err.response?.data?.message || 
          'Failed to retrieve your order history logs from the server.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchMyOrders();
    }
  }, [token, authLoading, navigate]);

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-xs text-slate-400 mt-3 italic">Retrieving order logs...</p>
      </div>
    );
  }

  return (
    <div className="pb-16 flex flex-col gap-8">
      {/* Editorial Header */}
      <div>
        <h1 className="font-serif text-3xl font-extrabold text-slate-950 tracking-tight">
          Your Orders
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, trace, and audit purchase logs and shipping operations.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-xs">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-rose-100 text-xs font-bold text-rose-900 px-4 py-2 hover:bg-rose-200"
          >
            Retry Request
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 px-4">
          <div className="rounded-full bg-slate-50 p-4 text-slate-400 mb-4">
            <PackageOpen className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-sans">No Orders Placed</h3>
          <p className="text-sm text-slate-500 max-w-xs text-center mt-1">
            You don't have any recorded orders yet. Let's find some outstanding essentials on the main showcase!
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        /* Accordion-based robust order logs lists */
        <div className="flex flex-col gap-4">
          {orders.map((order, inX) => {
            const orderId = order._id || order.id || `ORD-${inX}`;
            const isExpanded = expandedOrderId === orderId;
            const itemsList = order.items || order.orderItems || [];
            const numItems = itemsList.reduce((add, item) => add + (item.quantity || item.qty || 1), 0);
            const orderTotal = order.totalAmount !== undefined ? order.totalAmount : (order.totalPrice || 0);

            return (
              <div
                key={orderId}
                className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                  isExpanded
                    ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Header overview row */}
                <div
                  onClick={() => toggleExpandOrder(orderId)}
                  className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 sm:p-6 cursor-pointer select-none hover:bg-slate-50/50"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 flex-1">
                    {/* Order Reference */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <Hash className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Order Ref</p>
                        <p className="text-xs font-mono font-bold text-slate-900 truncate max-w-28 sm:max-w-xs select-all">
                          {orderId}
                        </p>
                      </div>
                    </div>

                    {/* Date Block */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Date Logged</p>
                        <p className="text-xs font-semibold text-slate-700">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Monetary total price */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <IndianRupee className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Charged</p>
                        <p className="text-sm font-black text-slate-900 font-mono">
                          ₹{orderTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Quantity items count */}
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quantity</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1">
                        {numItems} item{numItems > 1 ? 's' : ''} inside
                      </p>
                    </div>
                  </div>

                  {/* Status & accordions button selectors */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <OrderStatusBadge type="paid" value={order.isPaid} date={order.paidAt} />
                      {getStatusBadge(order.status)}
                    </div>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-250 bg-white text-slate-650 hover:bg-slate-50 transition-colors"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Itemized lists */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 sm:px-6 py-5 flex flex-col gap-5">
                    {/* Items table list */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Item Breakdown</h4>
                      <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white">
                        <div className="divide-y divide-slate-100">
                          {itemsList.map((item, idx) => {
                            const productObj = typeof item.product === 'object' && item.product !== null ? item.product : null;
                            const productName = productObj?.name || item.name || 'Product';
                            const productCategory = productObj?.category || item.category || 'Uncategorized';
                            const visualImage = productObj?.imageUrl || productObj?.image || item.image || item.imageUrl;
                            const price = item.price || productObj?.price || 0;
                            const qty = item.quantity || item.qty || 1;

                            // Fallback
                            const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';

                            return (
                              <div key={`${productObj?._id || productObj?.id || idx}`} className="flex items-center justify-between gap-4 p-4 text-xs font-sans">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-50 border border-slate-100">
                                    <img
                                      src={visualImage || fallbackImage}
                                      alt={productName}
                                      className="h-full w-full object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = fallbackImage;
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 line-clamp-1">{productName}</p>
                                    <p className="text-slate-400 mt-0.5 capitalize">{productCategory}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-slate-950 font-mono">₹{(price * qty).toFixed(2)}</p>
                                  <p className="text-slate-400 font-mono mt-0.5">{qty}x @ ₹{price.toFixed(2)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address review summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-200/50 bg-white p-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Delivery Address</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium whitespace-pre-line">
                          {renderAddress(order.shippingAddress)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/50 bg-white p-4 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Billing Parameters</h4>
                          <p className="text-xs text-slate-600 font-sans font-medium">
                            Settled via <span className="font-bold text-slate-750 underline decoration-indigo-300">{getPaymentLabel(order.paymentMethod)}</span>
                          </p>
                        </div>
                        <div className="flex items-baseline justify-between mt-3 text-xs pt-3 border-t border-slate-50">
                          <span className="text-slate-400">Charged Amount</span>
                          <span className="text-sm font-extrabold text-indigo-600 font-mono">₹{orderTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
