import React from 'react';

const VARIANT_STYLES = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-slate-800 text-slate-300 border-slate-700',
};

export const Badge = ({ variant = 'neutral', size = 'md', children, className = '' }) => {
  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold tracking-wide whitespace-nowrap ${VARIANT_STYLES[variant] || VARIANT_STYLES.neutral} ${sizeCls} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;