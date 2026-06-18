import React from 'react';

interface OrderStatusBadgeProps {
  type: 'paid' | 'delivered';
  value?: boolean;
  date?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ type, value = false, date }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (type === 'paid') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          value 
            ? 'bg-teal-50 text-teal-800 border border-teal-100' 
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${value ? 'bg-teal-500' : 'bg-rose-500'}`} />
          {value ? 'Paid' : 'Unpaid'}
        </span>
        {value && date && (
          <span className="text-[11px] text-slate-500 italic mt-0.5 sm:mt-0 sm:ml-1">
            on {formatDate(date)}
          </span>
        )}
      </div>
    );
  }

  // Otherwise delivered status
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        value 
          ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' 
          : 'bg-slate-100 text-slate-700 border border-slate-200'
      }`}>
        <span className={`h-1.5 w-1.5 rounded-full ${value ? 'bg-indigo-500' : 'bg-slate-400'}`} />
        {value ? 'Delivered' : 'Processing (Not Delivered)'}
      </span>
      {value && date && (
        <span className="text-[11px] text-slate-500 italic mt-0.5 sm:mt-0 sm:ml-1">
          on {formatDate(date)}
        </span>
      )}
    </div>
  );
};
