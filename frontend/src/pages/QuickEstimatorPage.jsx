import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { priceLibraryApi } from '../features/boq/boqApi';
import api from '../api/axios';
import { formatCount } from '../components/dxf/DrawingViewerWidgets';
import {
  Calculator, Plus, Trash2, RefreshCw, AlertCircle, Sparkles,
  FileText, DollarSign, TrendingUp, Ruler,
} from 'lucide-react';

const EMPTY_PRICES = {
  concrete_price: '', steel_price: '', block_price: '',
  factory_rate: '', overhead: '', profit_rate: '',
  backfill_qty: '', backfill_price: '', insulation_qty: '', insulation_price: '',
};

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const fmt = (v) => (v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }));

export const QuickEstimatorPage = () => {
  const [catalog, setCatalog] = useState([]);
  const [prices, setPrices] = useState(EMPTY_PRICES);
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ name: '', length: '', width: '', thickness: '', pre_area: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await api.get('/estimate/catalog');
      if (res.data.success) setCatalog(res.data.data);
    } catch {
      setError('فشل تحميل بنود الحاسبة');
    }
  }, []);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const groups = catalog.reduce((acc, c) => {
    (acc[c.group_label] = acc[c.group_label] || []).push(c);
    return acc;
  }, {});

  const prefillFromLibrary = async () => {
    try {
      const res = await priceLibraryApi.list();
      if (!res.success) return;
      const byType = Object.fromEntries(res.data.map(p => [p.element_type, p.unit_price]));
      setPrices(prev => ({
        ...prev,
        concrete_price: byType.concrete_slab ?? byType.concrete_wall ?? prev.concrete_price,
        steel_price: byType.rebar ?? prev.steel_price,
      }));
    } catch {
      setError('فشل التعبئة من بنك الأسعار');
    }
  };

  const addItem = () => {
    if (!draft.name) { setError('اختر البند أولاً'); return; }
    setError('');
    setItems(prev => [...prev, {
      key: `${Date.now()}-${prev.length}`,
      name: draft.name,
      length: num(draft.length), width: num(draft.width),
      thickness: num(draft.thickness), pre_area: num(draft.pre_area),
    }]);
    setDraft({ name: '', length: '', width: '', thickness: '', pre_area: '' });
  };

  const calculate = async () => {
    if (items.length === 0) { setError('أضف بندًا واحدًا على الأقل'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/estimate/calculate', {
        items: items.map(({ name, length, width, thickness, pre_area }) =>
          ({ name, length, width, thickness, pre_area })),
        prices: Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, num(v)])),
      });
      if (res.data.success) setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل الحساب');
    } finally {
      setLoading(false);
    }
  };

  const priceField = (key, label, unit) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label} ({unit})</label>
      <input
        type="number" min="0" value={prices[key]}
        onChange={e => setPrices({ ...prices, [key]: e.target.value })}
        placeholder="0"
        className="w-full bg-slate-800/80 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="الحاسبة التقديرية"
        subtitle="تقدير سريع لفلل سكنية: خرسانة وحديد وبلوك من الأبعاد"
        actions={
          <>
            <button onClick={prefillFromLibrary} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>تعبئة الأسعار من البنك</span>
            </button>
            <button onClick={calculate} disabled={loading || items.length === 0} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold">
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
              <span>{loading ? 'جارٍ الحساب...' : 'احسب'}</span>
            </button>
          </>
        }
      />

      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Prices */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2 mb-5">
            <DollarSign className="w-5 h-5 text-amber-400" />
            الأسعار والمعاملات
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {priceField('concrete_price', 'الخرسانة', 'ر.س/م³')}
            {priceField('steel_price', 'الحديد', 'ر.س/طن')}
            {priceField('block_price', 'البلوك', 'ر.س')}
            {priceField('factory_rate', 'المصنعية', 'ر.س/م²')}
            {priceField('profit_rate', 'الربح', '%')}
            {priceField('overhead', 'مصاريف إدارية', 'ر.س')}
            {priceField('backfill_qty', 'كمية الدفان', 'م³')}
            {priceField('backfill_price', 'سعر الدفان', 'ر.س')}
            {priceField('insulation_qty', 'كمية العزل', 'م²')}
            {priceField('insulation_price', 'سعر العزل', 'ر.س')}
          </div>
        </div>

        {/* Item editor */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2 mb-5">
            <Ruler className="w-5 h-5 text-blue-400" />
            بنود التقدير ({formatCount(items.length)})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            <select
              value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
              className="md:col-span-2 bg-slate-800/80 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
            >
              <option value="">اختر البند...</option>
              {Object.entries(groups).map(([g, list]) => (
                <optgroup key={g} label={g}>
                  {list.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </optgroup>
              ))}
            </select>
            {['length', 'width', 'thickness'].map(k => (
              <input
                key={k} type="number" min="0" value={draft[k]}
                onChange={e => setDraft({ ...draft, [k]: e.target.value })}
                placeholder={{ length: 'الطول (م)', width: 'العرض (م)', thickness: 'السماكة (م)' }[k]}
                className="bg-slate-800/80 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
              />
            ))}
            <button onClick={addItem} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> إضافة
            </button>
          </div>
          {draft.name === 'كل المصاعد' && (
            <input
              type="number" min="0" value={draft.pre_area}
              onChange={e => setDraft({ ...draft, pre_area: e.target.value })}
              placeholder="مسطح المصاعد (م²) — يدوي"
              className="w-full md:w-64 bg-slate-800/80 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition mb-4"
            />
          )}
          {items.length > 0 && (
            <div className="space-y-1.5">
              {items.map(it => (
                <div key={it.key} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2 text-xs">
                  <span className="text-slate-200 font-semibold">{it.name}</span>
                  <span className="text-slate-500" dir="ltr">{it.length} × {it.width} × {it.thickness}</span>
                  <button onClick={() => { setItems(prev => prev.filter(x => x.key !== it.key)); }} className="p-1 text-slate-400 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'خرسانة', value: `${fmt(result.totals.concrete_m3)} م³`, color: 'text-slate-200' },
                { label: 'حديد', value: `${fmt(result.totals.steel_tons)} طن`, color: 'text-orange-400' },
                { label: 'بلوك', value: fmt(result.totals.blocks), color: 'text-blue-400' },
                { label: 'السعر النهائي', value: `${fmt(result.totals.final_price)} ر.س`, color: 'text-emerald-400' },
              ].map(c => (
                <div key={c.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 mb-2">{c.label}</div>
                  <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  تفصيل البنود
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {fmt(result.totals.cost_per_m2)} ر.س/م²
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 text-xs text-slate-400">
                      <th className="text-right py-3 px-4 font-semibold">البند</th>
                      <th className="text-right py-3 px-4 font-semibold">خرسانة (م³)</th>
                      <th className="text-right py-3 px-4 font-semibold">حديد (طن)</th>
                      <th className="text-right py-3 px-4 font-semibold">بلوك</th>
                      <th className="text-right py-3 px-4 font-semibold">الإجمالي (ر.س)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {result.items.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 text-white font-semibold">{t.name}</td>
                        <td className="py-3 px-4 text-slate-300">{fmt(t.concrete_m3)}</td>
                        <td className="py-3 px-4 text-slate-300">{fmt(t.steel_tons)}</td>
                        <td className="py-3 px-4 text-slate-300">{fmt(t.blocks)}</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">{fmt(t.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickEstimatorPage;
