import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, LogIn, Percent, Loader } from 'lucide-react';

export const Cart: React.FC = () => {
  const { cart, cartCount, token, removeFromCart, fetchCart, loading } = useAuth();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync / Fetch cart on mount
  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token]);

  const handleRemove = async (productId: string) => {
    setSyncing(true);
    setError(null);
    try {
      await removeFromCart(productId);
    } catch (err: any) {
      console.error('Error removing item from cart:', err);
      setError('Could not remove item. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Calculations
  const calculateSubtotal = () => {
    return cart.reduce((add, item) => {
      const price = item.product?.price || 0;
      const qty = item.quantity || 1;
      return add + price * qty;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shipping = subtotal > 150 || subtotal === 0 ? 0 : 9.99;
  const estTax = subtotal * 0.08; // 8% sales tax
  const grandTotal = subtotal + shipping + estTax;

  if (!token) {
    return (
      <div className="mx-auto max-w-xl py-16 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">Your Shopping Cart</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
            Please log in or register a free account first to load and synchronize your active shopping cart.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-150 hover:bg-indigo-700 transition-all"
            >
              <LogIn className="h-4 w-4" />
              <span>Log In</span>
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all font-sans"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 flex flex-col gap-8">
      {/* Editorial Header */}
      <div>
        <h1 className="font-serif text-3xl font-extrabold text-slate-950 tracking-tight">
          Your Shopping Bag
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {cartCount === 0 ? 'Your bag is dry' : `You have ${cartCount} items inside your order cart`}
        </p>
      </div>

      {loading && cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-xs text-slate-400 mt-3 italic">Synchronizing cart...</p>
        </div>
      ) : cart.length === 0 ? (
        /* Empty Plate cart */
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 px-4">
          <div className="rounded-full bg-slate-50 p-4 text-slate-400 mb-4 animate-bounce">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-sans">No items in your bag</h3>
          <p className="text-sm text-slate-500 max-w-xs text-center mt-1">
            Let's find some amazing premium retail products to kickstart your shopping.
          </p>
          <Link
            to="/"
            className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Continue Browsing</span>
          </Link>
        </div>
      ) : (
        /* Main twin design card layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart items lists (Takes 8 blocks) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="divide-y divide-slate-100">
                {cart.map((item, index) => {
                  const product = item.product;
                  if (!product) return null;

                  const prodId = product._id || product.id || '';
                  const price = product.price || 0;
                  const qty = item.quantity || 1;
                  const itemTotal = price * qty;
                  const rawImage = product.imageUrl || product.image;
                  
                  // Fallbacks
                  const getFallbackImage = (category: string = '') => {
                    const cat = category.toLowerCase();
                    if (cat.includes('electr')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&q=80';
                    if (cat.includes('cloth') || cat.includes('apparel')) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=150&q=80';
                    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&q=80';
                  };

                  const imageUrl = rawImage || getFallbackImage(product.category);

                  return (
                    <div key={`${prodId}-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 hover:bg-slate-50/50 transition-colors">
                      {/* Product Thumbnail & Core infos */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover object-center"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = getFallbackImage(product.category);
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-sans text-sm font-semibold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors">
                            <Link to={`/products/${prodId}`}>{product.name}</Link>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5 capitalize">{product.category || 'Lifestyle'}</p>
                          <div className="flex items-center gap-3 mt-2 sm:hidden">
                            <span className="text-xs font-mono font-semibold text-slate-500">{qty}x</span>
                            <span className="text-sm font-extrabold text-indigo-600">₹{price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity display & Line pricing for Tablet/Desktop */}
                      <div className="hidden sm:flex items-center justify-end gap-12 text-right">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">Quantity</p>
                          <span className="inline-flex h-7 px-2.5 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-800 font-mono">
                            {qty}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-0.5 font-sans">Total Price</p>
                          <span className="text-sm font-extrabold text-slate-900 font-mono">
                            ₹{itemTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Delete buttons */}
                      <button
                        onClick={() => handleRemove(prodId)}
                        disabled={syncing}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 border border-slate-200 bg-white shadow-xs hover:border-red-100 hover:text-red-500 hover:bg-red-50 disabled:opacity-45 transition-all self-end sm:self-center cursor-pointer"
                        title="Remove product"
                      >
                        {syncing ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Back action */}
            <div className="flex">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Calculation summary (Takes 4 blocks) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-md shadow-slate-50">
            <h3 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-4">
              Order Summary
            </h3>

            {/* Promo application block */}
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Promo Code"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                  disabled
                />
              </div>
              <button disabled className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-400 cursor-not-allowed">
                Apply
              </button>
            </div>

            {/* Dynamic line breakdowns */}
            <div className="mt-6 flex flex-col gap-3 font-sans text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-bold text-slate-900 font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping Estimate</span>
                <span className="font-bold text-slate-900 font-mono">
                  {shipping === 0 ? <span className="text-teal-600 font-semibold font-sans">FREE</span> : `₹${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Tax (8%)</span>
                <span className="font-bold text-slate-900 font-mono">₹{estTax.toFixed(2)}</span>
              </div>
              
              <hr className="border-slate-100 my-1" />

              <div className="flex items-baseline justify-between text-base">
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="text-2xl font-black text-indigo-600 font-mono">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Hint for free shipping limits */}
            {subtotal < 150 && (
              <div className="mt-4 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100/30 text-[10px] text-indigo-800 font-sans text-center">
                Add <span className="font-bold font-mono">₹{(150 - subtotal).toFixed(2)}</span> more to unlock <span className="font-bold uppercase">Free Shipping</span>!
              </div>
            )}

            {/* Checkout Action links */}
            <button
              onClick={() => navigate('/placeorder')}
              className="mt-6 flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.01] transition-all cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
