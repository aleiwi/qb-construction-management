import React from 'react';

const VARIANT_STYLES = {
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  error: 'bg-red-500/10 text-red-300 border-red-500/30',
  info: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  neutral: 'bg-slate-800/60 text-slate-400 border-slate-700/60',
};

export const Badge = ({ variant = 'neutral', children, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${VARIANT_STYLES[variant] || VARIANT_STYLES.neutral} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;