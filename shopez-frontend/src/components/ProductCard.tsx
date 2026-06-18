import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, token } = useAuth();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const id = product._id || product.id || '';
  const price = product.price || 0;
  const rawImage = product.imageUrl || product.image;
  // Fallbacks based on category to look highly premium out of the box
  const getFallbackImage = (category: string = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('electr')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
    if (cat.includes('cloth') || cat.includes('apparel')) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80';
    if (cat.includes('shoe')) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80';
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'; // Watch/Generic
  };

  const imageUrl = rawImage || getFallbackImage(product.category);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) {
      setMessage({ type: 'error', text: 'Sign in to add items' });
      setTimeout(() => setMessage(null), 2500);
      return;
    }

    setAdding(true);
    try {
      await addToCart(id, 1);
      setMessage({ type: 'success', text: 'Added to cart!' });
      setTimeout(() => setMessage(null), 2500);
    } catch (err: any) {
      setMessage({
        type: 'error', 
        text: err.response?.data?.message || 'Failed to add item'
      });
      setTimeout(() => setMessage(null), 2500);
    } finally {
      setAdding(false);
    }
  };

  const stockCount = product.countInStock !== undefined ? product.countInStock : (product.stock !== undefined ? product.stock : 0);
  const isOutOfStock = stockCount <= 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-0.5">
      {/* Category Tag */}
      <span className="absolute top-3 left-3 z-10 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase text-white backdrop-blur-xs">
        {product.category || 'Uncategorized'}
      </span>

      {/* Image Showcase */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Replace with fallback image if load fails
            (e.currentTarget as HTMLImageElement).src = getFallbackImage(product.category);
          }}
        />
        {/* Quick Hover Layer */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center gap-2">
          <Link
            to={`/products/${id}`}
            className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-slate-50 hover:scale-105"
          >
            <Eye className="h-4 w-4" />
            Quick View
          </Link>
        </div>
      </div>

      {/* Details info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2">
          <h3 className="line-clamp-1 font-sans text-base font-semibold tracking-tight text-slate-900 duration-300 hover:text-indigo-600">
            <Link to={`/products/${id}`}>{product.name}</Link>
          </h3>
          <p className="line-clamp-2 mt-1 text-xs text-slate-500 h-8">
            {product.description || 'No description provided.'}
          </p>
        </div>

        {/* Pricing & Stock level */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100">
          <div>
            <span className="text-3xl font-extrabold tracking-tight text-indigo-600">
              ₹{price.toFixed(2)}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
              {isOutOfStock ? (
                <span className="text-red-500 font-medium">Out of Stock</span>
              ) : (
                <span>Stock: {stockCount} left</span>
              )}
            </p>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={adding || isOutOfStock}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold shadow-xs transition-all ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white'
            }`}
            title="Quick add to Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{adding ? 'Adding...' : 'Add'}</span>
          </button>
        </div>

        {/* Floating feedback message inside the card */}
        {message && (
          <div className="absolute inset-x-0 bottom-0 py-2 text-center text-xs font-semibold transition-all">
            <div className={`mx-4 rounded-lg p-2 shadow-md ${
              message.type === 'success' 
                ? 'bg-slate-900 text-teal-400' 
                : 'bg-red-500 text-white'
            }`}>
              {message.text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
