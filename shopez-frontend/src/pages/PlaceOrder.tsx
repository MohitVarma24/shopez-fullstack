import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../lib/api';
import { ArrowLeft, CheckCircle2, ShieldCheck, CreditCard, Landmark, Truck } from 'lucide-react';

export const PlaceOrder: React.FC = () => {
  const { cart, cartCount, token, clearCartState, fetchCart } = useAuth();
  const navigate = useNavigate();

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState<string | null>(null); // Order ID on success

  // Protect route & verify cart is not empty
  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: { pathname: '/placeorder' } } });
      return;
    }
    if (cart.length === 0) {
      // Sync once, in case it wasn't loaded, otherwise boot to cart
      fetchCart().then(() => {
        if (cart.length === 0) {
          navigate('/cart');
        }
      });
    }
  }, [token, cart.length, navigate]);

  // Calculations
  const subtotal = cart.reduce((add, item) => {
    const price = item.product?.price || 0;
    const qty = item.quantity || 1;
    return add + price * qty;
  }, 0);

  const shipping = subtotal > 150 ? 0 : 9.99;
  const grandTotal = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setError('Please provide complete shipping details.');
      return;
    }

    setLoading(true);
    setError(null);

    // Prepare robust order payload supporting the exact expected format
    const orderPayload = {
      shippingAddress: {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim()
      },
      paymentMethod
    };

    try {
      // POST /api/orders
      const res = await API.post('/api/orders', orderPayload);
      
      const createdOrderId = res.data?._id || res.data?.id || 'SUCCESS';
      setOrderConfirmed(createdOrderId);
      
      // Clear global state cart on successful checkout
      clearCartState();
    } catch (err: any) {
      console.error('Error placing order:', err);
      setError(
        err.response?.data?.message || 
        'Could not log this order on the server. Please check your inputs and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="mx-auto max-w-lg py-16 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4 animate-bounce">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          
          <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">Order Confirmed!</h2>
          <p className="text-sm font-medium text-slate-500 mt-2 font-sans">
            Thank you for shopping with ShopEZ. Your order was successfully logged under reference:
          </p>
          <p className="text-xs font-mono bg-slate-50 text-slate-600 rounded-lg p-2 mt-3 select-all">
            {orderConfirmed}
          </p>

          <p className="text-sm text-slate-400 mt-4 leading-relaxed font-sans">
            We will process your specifications and dispatch them shortly. You can track status inside your dashboard logs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/myorders"
              className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all text-center"
            >
              View My Orders
            </Link>
            <Link
              to="/"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all text-center"
            >
              Back to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 flex flex-col gap-6">
      {/* Navigate back */}
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart Shopping Bag
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-3xl font-extrabold text-slate-950 tracking-tight">
          Secure Checkout
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your items and select shipping / private billing parameters
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* Main Grid Column Split */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Details (Takes 7 blocks) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Shipping Address Container block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
              <Truck className="h-5 w-5 text-indigo-600" />
              <h3 className="text-md font-bold text-slate-900 font-sans">Shipping Details</h3>
            </div>

            <div className="flex flex-col gap-4 font-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Street</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street / Apartment / House No"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pincode</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              <h3 className="text-md font-bold text-slate-900 font-sans">Billing Parameters</h3>
            </div>

            <div className="flex flex-col gap-3 font-sans">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Select Payment Method</span>
              
              {/* Option 1: COD */}
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer select-none transition-all ${
                paymentMethod === 'COD'
                  ? 'border-indigo-600 bg-indigo-50/10'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="h-4 w-4 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</p>
                    <p className="text-xs text-slate-400 mt-0.5">Settle with the shipping carrier directly upon receipt</p>
                  </div>
                </div>
                <Truck className="h-5 w-5 text-slate-400" />
              </label>

              {/* Option 2: Online Payment */}
              <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer select-none transition-all ${
                paymentMethod === 'online'
                  ? 'border-indigo-600 bg-indigo-50/10'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="h-4 w-4 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Online Payment</p>
                    <p className="text-xs text-slate-400 mt-0.5">Pay securely with online payment gateways</p>
                  </div>
                </div>
                <CreditCard className="h-5 w-5 text-slate-400" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Item list (Takes 5 blocks) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md shadow-slate-50/40">
            <h3 className="text-base font-bold text-slate-900 font-sans border-b border-slate-100 pb-4 mb-4">
              Checkout Bag ({cartCount} items)
            </h3>

            {/* List mini table */}
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto mb-4 pr-1">
              {cart.map((item, idX) => {
                const product = item.product;
                if (!product) return null;
                const qty = item.quantity || 1;
                const pId = product._id || product.id || '';
                const price = product.price || 0;

                return (
                  <div key={`${pId}-${idX}`} className="flex items-center justify-between gap-3 py-3 text-xs">
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-slate-900 line-clamp-1">{product.name}</span>
                      <span className="text-slate-400 mt-0.5 font-mono">{qty} Unit(s) at ₹{price.toFixed(2)} each</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">₹{(price * qty).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Price lines breakdowns */}
            <hr className="border-slate-100 mb-4" />
            
            <div className="flex flex-col gap-2 text-xs font-sans">
              <div className="flex justify-between text-slate-500">
                <span>Cart Subtotal</span>
                <span className="font-bold text-slate-900 font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping fee</span>
                <span className="font-bold text-slate-900 font-mono">
                  {shipping === 0 ? <span className="text-teal-600 font-semibold font-sans">FREE</span> : `₹${shipping.toFixed(2)}`}
                </span>
              </div>

              <hr className="border-slate-100 my-2" />

              <div className="flex items-baseline justify-between text-sm">
                <span className="font-bold text-slate-900">Total Purchase Value</span>
                <span className="text-xl font-black text-indigo-600 font-mono">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Secure payment protection indicators */}
            <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-[10px] text-slate-500 leading-normal font-sans">
              <ShieldCheck className="h-6 w-6 text-teal-600 shrink-0" />
              <span>
                ShopEZ secures all transaction processing tunnels with 256-bit bank grade encryption protocols.
              </span>
            </div>

            {/* Order Placement execution */}
            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="mt-5 flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-150 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <span>{loading ? 'Processing Order...' : `Place Secure Order (₹${grandTotal.toFixed(2)})`}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
