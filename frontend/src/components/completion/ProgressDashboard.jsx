import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Printer, TrendingUp, TrendingDown, Minus, CheckCircle2,
  Clock3, Circle, Layers, Building2, Wallet, Camera
} from 'lucide-react';
import {
  calcStructureProgress, calcFinishingProgress, calcOverallProgress,
  calcSectorProgress, formatCurrency
} from './defaultCompletionData';
import { completionReportsApi } from '../../features/reports/completionReportsApi';
import ProgressPrintReport from './ProgressPrintReport';

const COLORS = {
  emerald: '#10b981',
  amber: '#f59e0b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  slate: '#64748b',
};

const getProgressColor = (value) => {
  const val = parseFloat(value) || 0;
  if (val >= 100) return COLORS.emerald;
  if (val >= 40) return COLORS.amber;
  if (val > 0) return COLORS.blue;
  return COLORS.slate;
};

const SectionTitle = ({ icon: Icon, title, subtitle, color = 'bg-blue-500/10 text-blue-400' }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
    </div>
  </div>
);

const ProgressBar = ({ value, color, height = 'h-2.5' }) => {
  const val = Math.min(100, Math.max(0, parseFloat(value) || 0));
  const c = color || getProgressColor(val);
  return (
    <div className={`w-full ${height} bg-slate-800 rounded-full overflow-hidden`}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, backgroundColor: c }} />
    </div>
  );
};

const Ring = ({ value, size = 168, stroke = 14, color = COLORS.emerald }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, parseFloat(value) || 0) / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
};

const ItemBar = ({ item }) => {
  const val = parseFloat(item.progress) || 0;
  const color = getProgressColor(val);
  const isDone = val >= 100;
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition">
      {isDone ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      ) : val > 0 ? (
        <Clock3 className="w-4 h-4 text-blue-400 shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-slate-600 shrink-0" />
      )}
      <span className="text-xs font-semibold text-slate-200 truncate flex-1">{item.name}</span>
      <ProgressBar value={val} height="h-1.5" />
      <span dir="ltr" className="w-11 text-center font-mono font-black text-[11px] shrink-0" style={{ color }}>{val}%</span>
    </div>
  );
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// ====== Screen-first interactive dashboard (the printable A4 report is rendered hidden) ======
export const ProgressDashboard = ({ data, delta = null, parentOverall = null }) => {
  const [exporting, setExporting] = useState(false);

  const stProgress = calcStructureProgress(data.structureItems);
  const fnProgress = calcFinishingProgress(data.finishingItems);
  const overall = calcOverallProgress(data.structureItems, data.finishingItems);

  const completedCount = data.structureItems.filter(i => i.progress >= 100).length + data.finishingItems.filter(i => i.progress >= 100).length;
  const activeCount = data.structureItems.filter(i => i.progress > 0 && i.progress < 100).length + data.finishingItems.filter(i => i.progress > 0 && i.progress < 100).length;
  const pendingCount = data.structureItems.filter(i => i.progress === 0).length + data.finishingItems.filter(i => i.progress === 0).length;
  const totalCount = data.structureItems.length + data.finishingItems.length;

  const sectorBars = data.finishingSectors.map((s) => ({
    id: s.id,
    name: s.name,
    value: calcSectorProgress(s.id, data.finishingItems),
    itemsCount: data.finishingItems.filter(it => it.sectorId === s.id).length,
  }));

  const paidCount = data.paymentsSchedule.filter(p => p.paid).length;
  const totalPaidVal = data.paymentsSchedule.filter(p => p.paid).reduce((s, p) => s + (p.totalVal || p.contractorVal + p.devVal), 0);
  const totalPendingVal = data.paymentsSchedule.filter(p => !p.paid).reduce((s, p) => s + (p.totalVal || p.contractorVal + p.devVal), 0);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await completionReportsApi.exportPDF(data);
    } catch (err) {
      console.error('PDF export failed:', err);
      let msg = err.message || 'خطأ غير معروف';
      const respData = err?.response?.data;
      if (respData instanceof Blob) {
        try {
          const parsed = JSON.parse(await respData.text());
          msg = parsed?.error?.message || parsed?.detail || msg;
        } catch {
          /* not JSON — keep default message */
        }
      } else if (respData?.error?.message) {
        msg = respData.error.message;
      } else if (respData?.detail) {
        msg = respData.detail;
      }
      alert('فشل تصدير PDF: ' + msg);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5 print:hidden">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-900/90 border border-slate-800 rounded-3xl p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-2xl flex items-center justify-center text-white font-black font-mono shrink-0">
            {data.projectNumber || '—'}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white leading-tight truncate">لوحة متابعة الإنجاز التنفيذي</h2>
            <p className="text-[11px] text-slate-400 truncate">{data.companyName || 'مسقا الأولى للتطوير العقاري'} — {data.projectName || 'مشروع'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition border border-slate-700">
            <Printer className="w-4 h-4 text-amber-400" /> طباعة المعتمد
          </button>
          <button onClick={handleExportPDF} disabled={exporting}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-2xl text-xs font-black flex items-center gap-2 transition shadow-md">
            <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            {exporting ? 'جارٍ تصدير ملف PDF...' : 'تصدير PDF (A4 Landscape)'}
          </button>
        </div>
      </div>

      {/* ===== Hero KPIs ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Overall ring */}
        <motion.div {...fadeIn} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center">
          <div className="relative">
            <Ring value={overall} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span dir="ltr" className="text-4xl font-black text-white font-mono">{overall}%</span>
              <span className="text-[10px] text-slate-400 mt-1">الإنجاز الإجمالي</span>
            </div>
          </div>
          {delta !== null && delta !== 0 && (
            <div className={`mt-3 text-sm font-bold flex items-center gap-1.5 ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {delta > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span dir="ltr">{delta > 0 ? `+${delta}%` : `${delta}%`}</span> عن الفترة السابقة
            </div>
          )}
          {delta === 0 && parentOverall !== null && (
            <div className="mt-3 text-sm font-semibold text-slate-500 flex items-center gap-1.5">
              <Minus className="w-4 h-4" /> لا تغيير عن الفترة السابقة
            </div>
          )}
        </motion.div>

        {/* Structure progress */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-300">أعمال العظم (الهيكل)</span>
            </div>
            <span dir="ltr" className="text-2xl font-black text-amber-400 font-mono">{stProgress}%</span>
          </div>
          <ProgressBar value={stProgress} color={COLORS.emerald} height="h-3" />
          <div className="mt-3 text-[11px] text-slate-400">
            {data.structureItems.length} بنداً · {stProgress === 100 ? 'منجزة بالكامل' : 'قيد التنفيذ'}
          </div>
        </motion.div>

        {/* Finishing progress */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-300">أعمال التشطيبات</span>
            </div>
            <span dir="ltr" className="text-2xl font-black text-purple-400 font-mono">{fnProgress}%</span>
          </div>
          <ProgressBar value={fnProgress} color={COLORS.purple} height="h-3" />
          <div className="mt-3 text-[11px] text-slate-400">
            {data.finishingItems.length} بنداً · {fnProgress === 100 ? 'منجزة بالكامل' : 'قيد التنفيذ'}
          </div>
        </motion.div>

        {/* Status counters */}
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-300 mb-1">حالة البنود</div>
            <div className="text-[11px] text-slate-500">{totalCount} بنداً هندسياً إجمالاً</div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> مكتملة
              </span>
              <span dir="ltr" className="font-mono font-black text-emerald-400">{completedCount}</span>
            </div>
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                <Clock3 className="w-4 h-4" /> قيد التنفيذ
              </span>
              <span dir="ltr" className="font-mono font-black text-amber-400">{activeCount}</span>
            </div>
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-700/20 border border-slate-600/40">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Circle className="w-4 h-4" /> لم تبدأ
              </span>
              <span dir="ltr" className="font-mono font-black text-slate-300">{pendingCount}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===== Sectors ===== */}
      <motion.div {...fadeIn} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
        <SectionTitle icon={Layers} title="إنجاز القطاعات الفرعية" subtitle="نسب إنجاز قطاعات التشطيبات محسوبة من بنودها" color="bg-purple-500/10 text-purple-400" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {sectorBars.map((s, idx) => {
            const color = getProgressColor(s.value);
            return (
              <div key={s.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3.5 hover:border-slate-600 transition">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                    <span dir="ltr" className="text-[10px] text-slate-500 font-mono shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                    {s.name}
                  </span>
                  <span dir="ltr" className="font-mono font-black text-sm shrink-0" style={{ color }}>{s.value}%</span>
                </div>
                <ProgressBar value={s.value} />
                <div className="text-[10px] text-slate-500 mt-1.5">{s.itemsCount} بنود</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ===== Structure items ===== */}
      <motion.div {...fadeIn} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
        <SectionTitle icon={Building2} title="بنود أعمال العظم" subtitle={`${data.structureItems.length} بنداً — متوسط الإنجاز ${stProgress}%`} color="bg-amber-500/10 text-amber-400" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {data.structureItems.map((it) => <ItemBar key={it.id} item={it} />)}
        </div>
      </motion.div>

      {/* ===== Finishing items by sector ===== */}
      <motion.div {...fadeIn} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
        <SectionTitle icon={Layers} title="بنود أعمال التشطيبات" subtitle={`${data.finishingItems.length} بنداً — متوسط الإنجاز ${fnProgress}%`} color="bg-teal-500/10 text-teal-400" />
        <div className="space-y-5">
          {data.finishingSectors.map((sec) => {
            const items = data.finishingItems.filter(f => f.sectorId === sec.id);
            if (!items.length) return null;
            return (
              <div key={sec.id}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-purple-400">{sec.name}</span>
                  <span className="text-[11px] text-slate-500">
                    {items.length} بنود · <span dir="ltr" className="font-mono font-bold text-slate-300">{calcSectorProgress(sec.id, data.finishingItems)}%</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {items.map(it => <ItemBar key={it.id} item={it} />)}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ===== Payments ===== */}
      <motion.div {...fadeIn} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
        <SectionTitle icon={Wallet} title="بيان الدفعات والمستحقات" subtitle={`${data.paymentsSchedule.length} مراحل تنفيذ`} color="bg-emerald-500/10 text-emerald-400" />
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
            {paidCount} من {data.paymentsSchedule.length} دفعات مدفوعة
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-700/30 border border-slate-600/50 text-[11px] font-bold text-slate-300">
            المصروف: {formatCurrency(totalPaidVal)}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-400">
            المتبقي: {formatCurrency(totalPendingVal)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="text-right text-[11px] text-slate-400 border-b border-slate-700">
                <th className="py-2.5 px-2 font-semibold">المرحلة</th>
                <th className="py-2.5 px-2 font-semibold text-center">النسبة</th>
                <th className="py-2.5 px-2 font-semibold text-center">المقاولات (ر.س)</th>
                <th className="py-2.5 px-2 font-semibold text-center">التطوير (ر.س)</th>
                <th className="py-2.5 px-2 font-semibold text-center">الإجمالي (ر.س)</th>
                <th className="py-2.5 px-2 font-semibold text-center">الحالة</th>
                <th className="py-2.5 px-2 font-semibold text-center">الاستحقاق</th>
              </tr>
            </thead>
            <tbody>
              {data.paymentsSchedule.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-2 font-semibold text-slate-200">{p.name}</td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-400">{p.ratio}%</td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-300">{formatCurrency(p.contractorVal)}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-300">{formatCurrency(p.devVal)}</td>
                  <td className="py-2.5 px-2 text-center font-mono font-black text-white">{formatCurrency(p.totalVal || (p.contractorVal + p.devVal))}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      p.paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.paid ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {p.paid ? 'مدفوع' : 'غير مدفوع'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-400">{p.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ===== Photos ===== */}
      {data.photoGallery.length > 0 && (
        <motion.div {...fadeIn} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
          <SectionTitle icon={Camera} title="التوثيق المصور للموقع" subtitle={`${data.photoGallery.length} صورة ميدانية`} color="bg-rose-500/10 text-rose-400" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.photoGallery.map((ph) => (
              <div key={ph.id} className="rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 group">
                <img src={ph.src} alt={ph.caption} className="w-full h-28 object-cover group-hover:scale-105 transition duration-500" />
                {ph.caption && <div className="px-2.5 py-1.5 text-[10px] text-slate-400 truncate">{ph.caption}</div>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ===== Print-only A4 report (hidden on screen, shown when printing) ===== */}
      <div className="hidden print:block">
        <ProgressPrintReport data={data} />
      </div>
    </div>
  );
};

export default ProgressDashboard;
