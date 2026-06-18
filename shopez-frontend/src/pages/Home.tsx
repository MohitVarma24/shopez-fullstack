import React, { useEffect, useState } from 'react';
import API from '../lib/api';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search, SlidersHorizontal, ShoppingBag, ArrowUpDown } from 'lucide-react';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await API.get('/api/products');
        
        if (Array.isArray(res.data)) {
          setProducts(res.data);
        } else if (res.data && Array.isArray(res.data.products)) {
          setProducts(res.data.products);
        } else {
          setProducts(res.data || []);
        }
        setError(null);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.response?.data?.message || 'Could not connect to the catalog server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Compute categories dynamically from fetched products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // Filtering & Sorting pipeline
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0; // Default
    });

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Editorial Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-indigo-900 text-white py-16 px-8 sm:px-12 md:py-20 shadow-xl shadow-indigo-100">
        <div className="absolute inset-0 bg-linear-to-r from-indigo-950 via-indigo-900 to-violet-900 opacity-90" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        
        <div className="relative z-10 max-w-2xl flex flex-col items-start gap-4">
          <span className="rounded-full bg-indigo-500/35 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-200">
            Summer Season Outlet
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Minimalist Design, <br />
            Maximum Performance.
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-md font-sans leading-relaxed">
            Discover our curated essentials designed for standard lifestyle perfection. Shop secure, get fast shipping.
          </p>
          <a
            href="#catalog"
            className="mt-4 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-950 shadow-md transition-all hover:bg-indigo-50 hover:scale-105"
          >
            Explore Catalog
          </a>
        </div>
      </section>

      {/* Main Grid Catalog */}
      <div id="catalog" className="scroll-mt-24 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 font-sans">
              Our Products
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Showing {filteredProducts.length} premium essentials
            </p>
          </div>

          {/* Filtering Widgets container */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
              <ArrowUpDown className="h-4 w-4 text-slate-400 mr-2" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="default">Default Sort</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Horizontal scrolling selectors */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <SlidersHorizontal className="h-4 w-4 text-slate-400 mr-1 shrink-0" />
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all uppercase tracking-wider ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 min-h-64">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="text-xs text-slate-400 italic mt-3 animate-pulse">Loading amazing product catalog...</p>
          </div>
        )}

        {/* Error notification */}
        {error && !loading && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-xs">
            <p className="text-sm font-semibold text-rose-800">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-rose-100 text-xs font-bold text-rose-900 px-4 py-2 hover:bg-rose-200 transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty Catalog lists */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 px-4 bg-white">
            <div className="rounded-full bg-slate-50 p-4 mb-4 text-slate-400">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No results found</h3>
            <p className="text-sm text-slate-500 max-w-sm text-center mt-1">
              We couldn't locate any products matching your current query. Try broadening your keywords.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSortBy('default');
              }}
              className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-slate-200"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Main Products Grid layout */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
