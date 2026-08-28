import React from 'react';

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl border border-slate-700 bg-slate-800 flex items-center justify-center mb-4 shadow-soft">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-base font-extrabold text-white mb-2" style={{ fontFamily: "'Cairo','Tajawal',sans-serif" }}>{title}</h3>
      {description && <p className="text-sm text-slate-300 leading-relaxed max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-blue-600/20 hover:shadow-xl hover:-translate-y-0.5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const SkeletonLines = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-3 rounded bg-slate-800/70 animate-pulse"
        style={{ width: `${[100, 88, 72][i % 3]}%` }}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-soft ${className}`}>
    <div className="w-11 h-11 rounded-xl bg-slate-800 animate-pulse mb-4" />
    <div className="h-4 w-3/4 bg-slate-800 rounded-lg animate-pulse mb-2" />
    <SkeletonLines lines={2} className="mt-3" />
  </div>
);

export const SkeletonList = ({ rows = 4, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-slate-800 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/2 bg-slate-800 rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-slate-800/60 rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export default EmptyState;