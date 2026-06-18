import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ShoppingCart, Plus, Minus, Tag, Check, X, AlertCircle } from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, token } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await API.get(`/api/products/${id}`);
        setProduct(res.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching product details:', err);
        setError(err.response?.data?.message || 'Product not found or fails to load.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product?.name) {
      document.title = `${product.name} | ShopEZ`;
    }
    return () => {
      document.title = 'ShopEZ';
    };
  }, [product]);

  const handleIncrement = () => {
    const stock = product?.countInStock ?? 99;
    if (quantity < stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      setMessage({ type: 'error', text: 'You must log in to add items to the cart.' });
      return;
    }

    if (!product) return;
    const prodId = product._id || product.id || '';

    setAddingToCart(true);
    setMessage(null);
    try {
      await addToCart(prodId, quantity);
      setMessage({ type: 'success', text: `Successfully added ${quantity} item(s) to your cart!` });
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Could not place item in the cart. Please try again.' 
      });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-xs text-slate-400 italic mt-3">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-xs">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 font-sans">Product Details Unavailable</h2>
          <p className="text-sm text-red-700 mt-2">{error || 'Something went wrong when fetching this product page.'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/"
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50"
            >
              Back to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallbacks based on category
  const getFallbackImage = (category: string = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('electr')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
    if (cat.includes('cloth') || cat.includes('apparel')) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80';
    if (cat.includes('shoe')) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80';
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'; // Generic
  };

  const rawImage = product.imageUrl || product.image;
  const imageUrl = rawImage || getFallbackImage(product.category);
  const stockCount = product.countInStock !== undefined ? product.countInStock : (product.stock !== undefined ? product.stock : 0);
  const isOutOfStock = stockCount <= 0;

  return (
    <div className="pb-16 flex flex-col gap-6">
      {/* Navigate Back Action link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>
      </div>

      {/* Main product display element */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xs">
        {/* Left Column: Product Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover object-center"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = getFallbackImage(product.category);
            }}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center">
              <span className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold tracking-wider text-white uppercase shadow-lg">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Descriptions & Actions details */}
        <div className="flex flex-col gap-6 justify-between py-2">
          <div className="flex flex-col gap-4">
            {/* Category Tag badge */}
            <div className="flex items-center gap-1.5 self-start rounded-full bg-indigo-50 border border-indigo-100/60 text-indigo-700 px-3 py-1 text-xs font-semibold capitalize tracking-wide select-none">
              <Tag className="h-3.5 w-3.5" />
              <span>{product.category || 'Uncategorized'}</span>
            </div>

            {/* Core Titles */}
            <div>
              <h1 className="font-sans text-3xl font-extrabold text-slate-950 tracking-tight leading-tight">
                {product.name}
              </h1>
              <p className="text-3xl font-black text-indigo-600 tracking-tight mt-2.5">
                ₹{(product.price || 0).toFixed(2)}
              </p>
            </div>

            <hr className="border-slate-100" />

            {/* Specification lists & Stock status */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-600">Availability:</span>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                    <X className="h-4 w-4" /> Unavailable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-teal-600">
                    <Check className="h-4 w-4" /> In Stock ({stockCount} units left)
                  </span>
                )}
              </div>
            </div>

            {/* Product description paragraph content */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-sans">
                {product.description || ''}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
            {/* Interactive Quantity Selector (Only if in stock) */}
            {!isOutOfStock && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Select Quantity</span>
                <div className="inline-flex items-center self-start border border-slate-200 rounded-xl bg-slate-50 p-1 select-none">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 bg-white shadow-xs border border-transparent hover:bg-slate-100 disabled:opacity-40 transition-all font-bold"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= stockCount}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 bg-white shadow-xs border border-transparent hover:bg-slate-100 disabled:opacity-40 transition-all font-bold"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || isOutOfStock}
                className={`flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-md transition-all ${
                  isOutOfStock
                    ? 'bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                    : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.01]'
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>{addingToCart ? 'Placing in Cart...' : 'Add to Cart'}</span>
              </button>

              {!token && (
                <p className="text-xs text-center text-slate-500 font-sans">
                  Need an account?{' '}
                  <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                    Log in here
                  </Link>
                </p>
              )}
            </div>

            {/* Display message inline inside the block */}
            {message && (
              <div className={`rounded-xl p-4 text-xs font-semibold ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                  : 'bg-rose-50 text-rose-800 border border-rose-100'
              }`}>
                <div className="flex gap-2 items-start">
                  <span className="font-sans leading-tight flex-1">{message.text}</span>
                  {message.type === 'success' && (
                    <Link to="/cart" className="underline font-bold text-emerald-900 whitespace-nowrap ml-2">
                      Go to Cart →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
