import React from 'react';
import { ShoppingBag } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold text-white tracking-tight">
              Shop<span className="text-indigo-500">EZ</span>
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support Care</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ShopEZ. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded border border-slate-800 font-mono tracking-wider">VISA</span>
            <span className="px-2 py-0.5 rounded border border-slate-800 font-mono tracking-wider">MC</span>
            <span className="px-2 py-0.5 rounded border border-slate-800 font-mono tracking-wider">AMEX</span>
            <span className="px-2 py-0.5 rounded border border-slate-800 font-mono tracking-wider">STRIPE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
