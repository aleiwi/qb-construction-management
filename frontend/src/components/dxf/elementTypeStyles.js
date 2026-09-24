// Display styles per canonical BOQ element type (extracted from DrawingViewerPage).
// Keys MUST stay in sync with backend ElementType + src/config/elementTypes.js.
// `footing` / `staircase` are legacy aliases kept for older cached data.

export const ELEMENT_TYPE_MAP = {
  wall: { label: 'جدار', color: 'border-r-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  column: { label: 'عمود', color: 'border-r-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  slab: { label: 'بلاطة', color: 'border-r-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  beam: { label: 'كمرة', color: 'border-r-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  foundation: { label: 'أساس', color: 'border-r-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' },
  door: { label: 'باب', color: 'border-r-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  window: { label: 'نافذة', color: 'border-r-sky-500', bg: 'bg-sky-500/10', text: 'text-sky-400', dot: 'bg-sky-400' },
  stairs: { label: 'درج', color: 'border-r-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  roof: { label: 'سقف', color: 'border-r-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  partition: { label: 'فاصل', color: 'border-r-teal-500', bg: 'bg-teal-500/10', text: 'text-teal-400', dot: 'bg-teal-400' },
  opening: { label: 'فتحة', color: 'border-r-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  furniture: { label: 'أثاث', color: 'border-r-lime-500', bg: 'bg-lime-500/10', text: 'text-lime-400', dot: 'bg-lime-400' },
  other: { label: 'أخرى', color: 'border-r-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
  // Aliases kept for backward compatibility with older cached data
  footing: { label: 'أساس', color: 'border-r-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400' },
  staircase: { label: 'درج', color: 'border-r-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
};
