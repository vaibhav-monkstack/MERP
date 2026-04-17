import React from 'react';

/**
 * StatusBadge Component
 * A consistent, pill-style badge for statuses across the platform.
 * Standardized on the Job Management "Master Theme".
 */
const StatusBadge = ({ status }) => {
  const getColors = (s) => {
    switch (s?.toLowerCase()) {
      case 'awaiting materials':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready to approve':
      case 'assembly':
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'created':
      case 'pending':
      case 'new':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'qc':
      case 'low stock':
      case 'shipped':
      case 'pending approval':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed':
      case 'active':
      case 'success':
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rework':
      case 'critical':
      case 'error':
      case 'cancelled':
      case 'returned':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${getColors(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
