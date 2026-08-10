// NewPeriodModal.jsx — لنشاء تقرير فترة جديدة مستنسخة من السابق
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Layers } from 'lucide-react';

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const toLocalISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const suggestNext = (periodText) => {
  let n = null;
  let year = new Date().getFullYear();
  const yearMatch = periodText?.match(/\b(20\d{2})\b/);
  if (yearMatch) year = parseInt(yearMatch[1], 10);
  const byNumber = periodText?.match(/شهر\s*(\d{1,2})/);
  if (byNumber) {
    n = parseInt(byNumber[1], 10);
  } else {
    const byName = periodText?.match(new RegExp(`(${MONTHS_AR.join('|')})`));
    if (byName) n = MONTHS_AR.indexOf(byName[1]) + 1;
  }
  if (!n) {
    const t = new Date();
    n = t.getMonth() + 1;
    year = t.getFullYear();
  }
  if (n >= 12) { n = 1; year += 1; } else { n += 1; }
  return { period: `${MONTHS_AR[n - 1]} ${year}`, start: toLocalISO(new Date(year, n - 1, 1)), end: toLocalISO(new Date(year, n, 0)) };
};

export const NewPeriodModal = ({ open, latestPeriod, loading, onCreate, onClose }) => {
  const [reportPeriod, setReportPeriod] = useState('');
  const [periodType, setPeriodType] = useState('monthly');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reportPeriod.trim()) { setError('اسم الفترة مطلوب'); return; }
    setError('');
    onCreate({ report_period: reportPeriod, period_type: periodType, period_start: periodStart, period_end: periodEnd });
  };

  // reset on open
  React.useEffect(() => {
    if (open) {
      const next = suggestNext(latestPeriod);
      setReportPeriod(next.period);
      setPeriodType('monthly');
      setPeriodStart(next.start);
      setPeriodEnd(next.end);
      setError('');
    }
  }, [open, latestPeriod]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">إنشاء تقرير فترة جديدة</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-300 flex items-start gap-2">
                <Copy className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  سيتم <strong>استنساخ كامل بنود ونسب</strong> آخر تقرير محفوظ{latestPeriod ? ` (${latestPeriod})` : ''} كمسودة (Draft) للتقرير الجديد — يظل التقرير السابق محفوظاً كأرشيف.
                </div>
              </div>
              {error && <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم/وصف الفترة</label>
                <input type="text" value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الفترة</label>
                <div className="flex gap-2">
                  {[['monthly', 'شهري'], ['weekly', 'أسبوعي']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setPeriodType(v)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${periodType === v ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">تاريخ البداية</label>
                  <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">تاريخ النهاية</label>
                  <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none transition" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition">إلغاء</button>
                <button type="submit" disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Copy className="w-4 h-4" />}
                  {loading ? 'جارٍ الاستنساخ...' : 'استنساخ وإنشاء'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewPeriodModal;