import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const PageHeader = ({ title, subtitle, backTo, actions }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
      <div className="flex items-center gap-3 min-w-0">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/50 rounded-xl transition shrink-0"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight truncate" style={{ fontFamily: "'Cairo','Tajawal',sans-serif" }}>{title}</h1>
          {subtitle && <p className="text-sm text-slate-300 mt-1 truncate font-medium">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};

export default PageHeader;