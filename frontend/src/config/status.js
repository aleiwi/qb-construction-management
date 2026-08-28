import { Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Centralized status configs — Single Source of Truth for badges.
 * Previously duplicated in 7+ pages. Import from here instead of redefining.
 */

// ── Projects ──
export const PROJECT_STATUS = {
  planning:    { label: 'قيد التخطيط',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'قيد التنفيذ',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  on_hold:     { label: 'معلق',         color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  completed:   { label: 'مكتمل',        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled:   { label: 'ملغي',         color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

// ── Contracts ──
export const CONTRACT_STATUS = {
  draft:      { label: 'مسودة',  color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  active:     { label: 'نشط',    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  completed:  { label: 'مكتمل',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  terminated: { label: 'ملغي',   color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

// ── Drawings — with icons for badges ──
export const DRAWING_STATUS = {
  pending:    { label: 'في الانتظار',  color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Clock },
  processing: { label: 'قيد المعالجة', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Loader2 },
  completed:  { label: 'تم بنجاح',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  failed:     { label: 'فشل',          color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertTriangle },
};

// ── Payments ──
export const PAYMENT_STATUS = {
  pending:  { label: 'في الانتظار', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'معتمدة',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  paid:     { label: 'مدفوعة',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'مرفوضة',     color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

// ── Quality Checks ──
export const QC_STATUS = {
  pending: { label: 'في الانتظار', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  passed:  { label: 'اجتاز الفحص', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed:  { label: 'راسب',        color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

// ── Generic badge variants — use with <Badge variant="..."> ──
export const BADGE_VARIANT_MAP = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  neutral: 'neutral',
};
