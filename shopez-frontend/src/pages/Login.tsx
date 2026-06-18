import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ShoppingBag, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get previous page or default to home page
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all inputs.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      // Success! Move back to homepage or previous view redirect
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login action failure:', err);
      setError(
        err.response?.data?.message || 
        'Could not log in. Please double-check your credentials and server connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto my-12 max-w-md w-full">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md">
        {/* Editorial Heading logo */}
        <div className="flex flex-col items-center gap-2 text-center mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-150">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight mt-3">
            Welcome Back to ShopEZ
          </h1>
          <p className="text-xs text-slate-500 max-w-xs font-sans">
            Log in to manage your private cart, place orders, and browse dynamic catalogs.
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mb-6 flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-sans">{error}</span>
          </div>
        )}

        {/* Login Form element */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email input block */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Password input block */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your security password"
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Submit Trigger Actions */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:bg-indigo-400 transition-all cursor-pointer"
          >
            <LogIn className="h-4.5 w-4.5" />
            <span>{loading ? 'Authenticating account...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Separator toggle links */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Don't have an retail account yet?{' '}
          <Link to="/register" className="text-indigo-600 font-bold hover:underline">
            Register a free account
          </Link>
        </div>

        {/* Dynamic Demo Hint Info */}
        <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/30 text-[11px] text-indigo-800/80 leading-relaxed text-center font-sans">
          <p className="font-semibold font-sans">💡 Testing Hint:</p>
          <p>Admin permissions can be tested with standard admin credentials, or log in with any user account.</p>
        </div>
      </div>
    </div>
  );
};
