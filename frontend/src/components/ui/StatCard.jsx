import React from 'react';

const ACCENT_STYLES = {
  blue: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  indigo: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  teal: 'border-teal-500/40 bg-teal-500/10 text-teal-400',
  rose: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
  cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  purple: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
};

export const StatCard = ({
  label,
  value,
  icon: Icon,
  accent = 'blue',
  hint,
  loading = false,
  onClick,
}) => {
  const accentCls = ACCENT_STYLES[accent] || ACCENT_STYLES.blue;

  if (loading) {
    return (
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-soft">
        <div className="w-11 h-11 rounded-xl bg-slate-800 animate-pulse mb-4" />
        <div className="h-8 w-20 bg-slate-800 rounded-lg animate-pulse mb-2" />
        <div className="h-3.5 w-28 bg-slate-800/60 rounded animate-pulse" />
      </div>
    );
  }

  const inner = (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shadow-sm ${accentCls}`}>
          <Icon className="w-5 h-5" />
        </div>
        {hint && <span className="text-xs text-slate-400 font-bold tracking-wide">{hint}</span>}
      </div>
      <div className="text-2xl md:text-3xl font-black text-white tabular-nums leading-none tracking-tight">{value}</div>
      <div className="mt-2.5 text-sm text-slate-300 font-semibold">{label}</div>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="text-right bg-slate-900/70 backdrop-blur border border-slate-800 hover:border-slate-700/80 hover:shadow-elevated rounded-2xl p-6 transition-all duration-200 group cursor-pointer text-right w-full"
      >
        {inner}
      </button>
    );
  }

  return <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow">{inner}</div>;
};

export default StatCard;