import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { priceLibraryApi } from '../features/boq/boqApi';
import api from '../api/axios';
import { formatCount } from '../components/dxf/DrawingViewerWidgets';
import {
  Calculator, Plus, Trash2, RefreshCw, AlertCircle, Sparkles,
  FileText, DollarSign, TrendingUp, Ruler, Search, Download,
  Building2, MapPin, CalendarDays, FlaskConical, Lightbulb,
  ShieldAlert, Info,
} from 'lucide-react';

const EMPTY_PRICES = {
  concrete_price: '', steel_price: '', block_price: '',
  factory_rate: '', overhead: '', profit_rate: '',
  backfill_qty: '', backfill_price: '', insulation_qty: '', insulation_price: '',
};

const EMPTY_PROJECT = {
  name: '', description: '', location: '',
  start_date: '', delivery_date: '', project_type: 'سكني', status: 'قيد التنفيذ',
};

const PROJECT_TYPES = ['سكني', 'تجاري', 'صناعي', 'إداري', 'أخرى'];
const PROJECT_STATUSES = ['قيد التنفيذ', 'تصميم', 'متوقف', 'مكتمل'];

// ألوان مجموعات البنود (مطابقة لهوية الواجهة الداكنة — بديل شارات الفئات في القديم)
const GROUP_STYLES = {
  foundations: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  slabs: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  columns: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  tanks: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  wells: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
  others: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const fmt = (v, d = 2) => (v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d }));

const fileStem = (name) => {
  const clean = (name || '').trim().replace(/[\\/:*?"<>|]/g, '').slice(0, 40);
  return clean || 'estimate';
};

export const QuickEstimatorPage = () => {
  const [catalog, setCatalog] = useState([]);
  const [project, setProject] = useState(EMPTY_PROJECT);
  const [prices, setPrices] = useState(EMPTY_PRICES);
  const [fieldErrors, setFieldErrors] = useState({});
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ name: '', length: '', width: '', thickness: '', pre_area: '', conversion_factor: '' });
  const [result, setResult] = useState(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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
    if (search && !c.name.includes(search)) return acc;
    (acc[c.group_label] = acc[c.group_label] || []).push(c);
    return acc;
  }, {});

  const catalogByName = useMemo(
    () => Object.fromEntries(catalog.map(c => [c.name, c])),
    [catalog],
  );

  const markStale = () => { if (result) setStale(true); };

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
      markStale();
    } catch {
      setError('فشل التعبئة من بنك الأسعار');
    }
  };

  // تحقق مفصّل لكل حقل (مكافئ validateProjectData في القديم)
  const validate = () => {
    const errs = {};
    if (project.name.trim() && /^[0-9]+$/.test(project.name.trim())) {
      errs.project_name = 'اسم المشروع يجب أن يحتوي على أحرف وليس أرقامًا فقط';
    }
    if (!(num(prices.concrete_price) > 0)) errs.concrete_price = 'سعر الخرسانة يجب أن يكون أكبر من صفر';
    if (!(num(prices.steel_price) > 0)) errs.steel_price = 'سعر الحديد يجب أن يكون أكبر من صفر';
    if (!(num(prices.block_price) > 0)) errs.block_price = 'سعر البلوك يجب أن يكون أكبر من صفر';
    if (prices.factory_rate !== '' && num(prices.factory_rate) < 0) errs.factory_rate = 'سعر المصنعية يجب أن يكون موجبًا';
    if (prices.profit_rate !== '' && num(prices.profit_rate) < 0) errs.profit_rate = 'نسبة الربح يجب أن تكون موجبة';
    return errs;
  };

  const selectedCatalog = catalog.find(c => c.name === draft.name);

  const addItem = () => {
    if (!draft.name) { setError('اختر البند أولاً'); return; }
    setError('');
    setItems(prev => [...prev, {
      key: `${Date.now()}-${prev.length}`,
      name: draft.name,
      length: num(draft.length), width: num(draft.width),
      thickness: num(draft.thickness), pre_area: num(draft.pre_area),
      conversion_factor: draft.conversion_factor === '' ? 1 : num(draft.conversion_factor),
    }]);
    setDraft({ name: '', length: '', width: '', thickness: '', pre_area: '', conversion_factor: '' });
    markStale();
  };

  const payloadOf = () => ({
    items: items.map(({ name, length, width, thickness, pre_area, conversion_factor }) =>
      ({ name, length, width, thickness, pre_area, conversion_factor })),
    prices: Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, num(v)])),
  });

  const calculate = async () => {
    if (items.length === 0) { setError('أضف بندًا واحدًا على الأقل'); return; }
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError('راجع الحقول المحددة بالأحمر قبل الحساب');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/estimate/calculate', payloadOf());
      if (res.data.success) { setResult(res.data.data); setStale(false); }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'فشل الحساب');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (format) => {
    const errs = validate();
    setFieldErrors(errs);
    if (items.length === 0 || Object.keys(errs).length > 0) {
      setError('أكمل البنود والأسعار قبل التصدير');
      return;
    }
    setExporting(format);
    try {
      const res = await api.post(`/estimate/export/${format}`, payloadOf(), { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileStem(project.name)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('فشل تصدير الملف');
    } finally {
      setExporting('');
    }
  };

  // المخرجات المحسوبة تظهر بجانب المدخلات متى تطابقت مع آخر حساب (نفس ترتيب الإرسال)
  const showOutputs = result && !stale && result.items.length === items.length;
  const computedByKey = useMemo(() => {
    if (!showOutputs) return {};
    return Object.fromEntries(items.map((it, i) => [it.key, result.items[i]]));
  }, [showOutputs, items, result]);

  // رؤى هندسية مشتقة من النتيجة (تبسيط صادق لمنطق useEngineeringCalculations في القديم:
  // WTO — بلا ادعاءات زلزالية/تصميمية، مؤشرات تخطيطية فقط)
  const insights = useMemo(() => {
    if (!showOutputs) return null;
    const t = result.totals;
    const conc = num(t.concrete_m3);
    const steelKg = num(t.steel_tons) * 1000;
    const ratio = conc > 0 ? steelKg / conc : 0; // كغ/م³
    const area = num(t.area_m2);
    const perM2 = area > 0 ? num(t.total_before_profit) / area : 0;
    const hints = [];
    if (area === 0 && items.length > 0) {
      hints.push({ level: 'warn', text: 'المسطح الإجمالي صفر — كل البنود المدخلة من نوع صفر-مساحة (أساسات/أعمدة). المصنعية تُحسب على المسطح، أضف بندًا مسطحيًا (أرضي/متكرر) لتقدير المصنعية.' });
    }
    if (ratio > 0 && ratio < 40) {
      hints.push({ level: 'info', text: `نسبة الحديد (${ratio.toFixed(0)} كغ/م³) منخفضة — طبيعي إذا غلبت صبة النظافة والأرضيات، وراجع إذا غلبت القواعد والأعمدة.` });
    }
    if (ratio > 200) {
      hints.push({ level: 'warn', text: `نسبة الحديد (${ratio.toFixed(0)} كغ/م³) مرتفعة جدًا — تحقق من السماكات المدخلة قبل الاعتماد.` });
    }
    if (num(prices.profit_rate) > 30) {
      hints.push({ level: 'warn', text: 'هامش الربح فوق 30% — سيرفع السعر النهائي كثيرًا عن التكلفة، راجع تنافسية العرض.' });
    }
    const complexity = ratio > 150 || conc > 500 ? 'عالية' : ratio > 100 || conc > 200 ? 'متوسطة' : 'منخفضة';
    return { ratio, perM2, complexity, hints };
  }, [showOutputs, result, items.length, prices.profit_rate]);

  const setPrice = (key, value) => {
    setPrices(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    markStale();
  };

  const priceField = (key, label, unit) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label} ({unit})</label>
      <input
        type="number" min="0" value={prices[key]}
        onChange={e => setPrice(key, e.target.value)}
        placeholder="0"
        className={`w-full bg-slate-800/80 border rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition ${
          fieldErrors[key] ? 'border-red-500' : 'border-slate-700 focus:border-amber-500'
        }`}
      />
      {fieldErrors[key] && <p className="text-red-400 text-[11px] mt-1">{fieldErrors[key]}</p>}
    </div>
  );

  const projectField = (key, label, type = 'text', Icon = null, extra = {}) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />}
        <input
          type={type} value={project[key]}
          onChange={e => setProject({ ...project, [key]: e.target.value })}
          className={`w-full bg-slate-800/80 border rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition ${
            Icon ? 'pr-10' : ''
          } ${fieldErrors[key] ? 'border-red-500' : 'border-slate-700 focus:border-amber-500'}`}
          {...extra}
        />
      </div>
      {fieldErrors[key] && <p className="text-red-400 text-[11px] mt-1">{fieldErrors[key]}</p>}
    </div>
  );

  const updateItem = (key, field, value) => {
    setItems(prev => prev.map(x => x.key === key ? { ...x, [field]: num(value) } : x));
    markStale();
  };

  const removeItem = (key) => {
    setItems(prev => prev.filter(x => x.key !== key));
    markStale();
  };

  const dimInput = (it, field, ph) => (
    <input
      type="number" min="0" value={it[field]}
      onChange={e => updateItem(it.key, field, e.target.value)}
      placeholder={ph} title={ph}
      className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none transition"
    />
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="الحاسبة التقديرية"
        subtitle="تقدير سريع لفلل سكنية: خرسانة وحديد وبلوك من الأبعاد — بنفس معادلات الحاسبة الأصلية"
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

        {/* معلومات المشروع (مكافئ ProjectSettings في القديم — محلية، تُستخدم في التسمية والعرض) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-amber-400" />
            معلومات المشروع
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projectField('name', 'اسم المشروع', 'text', Building2, { placeholder: 'مثال: فلة النرجس' })}
            {projectField('location', 'الموقع', 'text', MapPin, { placeholder: 'المدينة، الحي' })}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">نوع المشروع</label>
              <select
                value={project.project_type} onChange={e => setProject({ ...project, project_type: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
              >
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              {projectField('description', 'وصف المشروع (اختياري)', 'text', FileText, { placeholder: 'وصف مختصر' })}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">الحالة</label>
              <select
                value={project.status} onChange={e => setProject({ ...project, status: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
              >
                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {projectField('start_date', 'تاريخ البداية', 'date', CalendarDays)}
            {projectField('delivery_date', 'تاريخ التسليم', 'date', CalendarDays)}
          </div>
        </div>

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

        {/* Item editor + grouped table (مكافئ CalculatorItemsTable: مدخلات/مخرجات/مسطحات) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="font-bold text-white text-base flex items-center gap-2 mb-5">
            <Ruler className="w-5 h-5 text-blue-400" />
            بنود التقدير ({formatCount(items.length)})
          </h3>
          <div className="relative max-w-xs mb-4">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث عن بند..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-4">
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
            {selectedCatalog?.factor_locked ? (
              <div className="px-4 py-2.5 rounded-xl text-center text-xs font-bold bg-slate-800/60 text-slate-500" title="معامل التحويل مقفل لهذا البند (صفر-مساحة)">
                0 (ثابت)
              </div>
            ) : (
              <input
                type="number" min="0" value={draft.conversion_factor}
                onChange={e => setDraft({ ...draft, conversion_factor: e.target.value })}
                placeholder="معامل التحويل (1)"
                title="معامل التحويل"
                className="bg-slate-800/80 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition"
              />
            )}
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
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs min-w-[900px]">
                <thead>
                  <tr className="text-[11px] font-bold">
                    <th className="bg-slate-800/80 text-slate-300 px-3 py-2.5 text-right border-l border-slate-700/60">البند</th>
                    <th colSpan="3" className="bg-blue-950/60 text-blue-300 px-3 py-2.5 text-center border-l border-slate-700/60">📝 المدخلات</th>
                    <th colSpan="4" className="bg-emerald-950/60 text-emerald-300 px-3 py-2.5 text-center border-l border-slate-700/60">📊 المخرجات{showOutputs ? '' : ' (بعد الحساب)'}</th>
                    <th colSpan="3" className="bg-purple-950/60 text-purple-300 px-3 py-2.5 text-center border-l border-slate-700/60">📐 المسطحات</th>
                    <th className="bg-slate-800/80 text-slate-300 px-3 py-2.5 text-center">إجراء</th>
                  </tr>
                  <tr className="bg-slate-800/40 text-slate-400 text-[11px]">
                    <th className="px-3 py-2 text-right font-medium">التصنيف</th>
                    <th className="px-2 py-2 font-medium">طول (م)</th>
                    <th className="px-2 py-2 font-medium">عرض (م)</th>
                    <th className="px-2 py-2 font-medium border-l border-slate-700/60">سماكة (م)</th>
                    <th className="px-2 py-2 font-medium">خرسانة (م³)</th>
                    <th className="px-2 py-2 font-medium">حديد (طن)</th>
                    <th className="px-2 py-2 font-medium">بلوك</th>
                    <th className="px-2 py-2 font-medium border-l border-slate-700/60">تكلفة (ر.س)</th>
                    <th className="px-2 py-2 font-medium">قبل التحويل</th>
                    <th className="px-2 py-2 font-medium">المعامل</th>
                    <th className="px-2 py-2 font-medium border-l border-slate-700/60">بعد التحويل</th>
                    <th className="px-2 py-2 font-medium">—</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {items.map(it => {
                    const c = computedByKey[it.key];
                    const meta = catalogByName[it.name];
                    return (
                      <tr key={it.key} className="hover:bg-slate-800/30 transition">
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-100">{it.name}</div>
                          {meta && (
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${GROUP_STYLES[meta.group] || GROUP_STYLES.others}`}>
                              {meta.group_label}
                            </span>
                          )}
                        </td>
                        <td className="px-1.5 py-2.5">{dimInput(it, 'length', 'طول')}</td>
                        <td className="px-1.5 py-2.5">{dimInput(it, 'width', 'عرض')}</td>
                        <td className="px-1.5 py-2.5 border-l border-slate-800/60">{dimInput(it, 'thickness', 'سماكة')}</td>
                        <td className="px-3 py-2.5 text-slate-300 text-center">{c ? fmt(c.concrete_m3) : '—'}</td>
                        <td className="px-3 py-2.5 text-slate-300 text-center">{c ? fmt(c.steel_tons, 3) : '—'}</td>
                        <td className="px-3 py-2.5 text-slate-300 text-center">{c ? fmt(c.blocks) : '—'}</td>
                        <td className="px-3 py-2.5 text-emerald-400 font-semibold text-center border-l border-slate-800/60">{c ? fmt(c.total_cost) : '—'}</td>
                        <td className="px-1.5 py-2.5">
                          {it.name === 'كل المصاعد'
                            ? <input type="number" min="0" value={it.pre_area} onChange={e => updateItem(it.key, 'pre_area', e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none transition" />
                            : <span className="text-slate-500 text-center block">—</span>}
                        </td>
                        <td className="px-1.5 py-2.5">
                          {meta?.factor_locked
                            ? <span className="text-slate-500 text-center block">0 (ثابت)</span>
                            : <input type="number" min="0" value={it.conversion_factor} onChange={e => updateItem(it.key, 'conversion_factor', e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none transition" />}
                        </td>
                        <td className="px-3 py-2.5 text-purple-300 text-center border-l border-slate-800/60">{c ? fmt(c.area_m2) : '—'}</td>
                        <td className="px-3 py-2.5 text-center">
                          <button onClick={() => removeItem(it.key)} className="p-1.5 text-slate-500 hover:text-red-400 transition" title="حذف البند">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <>
            {stale && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-2xl text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>تغيرت المدخلات — أعد الحساب لنتائج محدثة</span>
              </div>
            )}

            {/* البطاقات الست (مكافئ CalculatorResults في القديم) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'الخرسانة', value: `${fmt(result.totals.concrete_m3)} م³`, grad: 'from-blue-500 to-cyan-500' },
                { label: 'الحديد', value: `${fmt(result.totals.steel_tons, 3)} طن`, grad: 'from-orange-500 to-amber-500' },
                { label: 'البلوك', value: `${fmt(result.totals.blocks, 0)} قطعة`, grad: 'from-yellow-500 to-orange-500' },
                { label: 'تكلفة المواد', value: `${fmt(result.totals.materials_cost)} ر.س`, grad: 'from-red-500 to-rose-500' },
                { label: 'المسطح الإجمالي', value: `${fmt(result.totals.area_m2)} م²`, grad: 'from-purple-500 to-pink-500' },
                { label: 'السعر النهائي', value: `${fmt(result.totals.final_price)} ر.س`, grad: 'from-emerald-500 to-green-500' },
              ].map(c => (
                <div key={c.label} className="group relative overflow-hidden bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center transition hover:scale-[1.03]">
                  <div className={`absolute inset-0 bg-gradient-to-r ${c.grad} opacity-15 group-hover:opacity-25 transition-opacity`} />
                  <div className="relative z-10">
                    <div className="text-xs text-slate-400 mb-2">{c.label}</div>
                    <div className="text-lg font-bold text-white">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* تفصيل التكاليف الإضافية + رؤى هندسية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-bold text-white text-base flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  تفصيل التكلفة
                  {project.name.trim() && <span className="text-xs font-normal text-slate-400">— {project.name.trim()}</span>}
                </h3>
                <div className="space-y-2.5 text-sm">
                  {[
                    ['تكلفة المواد', result.totals.materials_cost, 'text-slate-300'],
                    ['المصنعية (المسطح × السعر)', result.totals.contractor_cost, 'text-slate-300'],
                    ['مصاريف إدارية', result.totals.overhead, 'text-slate-300'],
                    ['الدفان', result.totals.backfill_cost, 'text-slate-300'],
                    ['العزل', result.totals.insulation_cost, 'text-slate-300'],
                    ['الإجمالي قبل الربح', result.totals.total_before_profit, 'text-white font-bold'],
                    ['الربح', result.totals.profit, 'text-amber-300 font-semibold'],
                    ['السعر النهائي', result.totals.final_price, 'text-emerald-400 font-bold'],
                  ].map(([label, v, cls]) => (
                    <div key={label} className="flex items-center justify-between border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                      <span className="text-slate-400">{label}</span>
                      <span className={cls}>{fmt(v)} ر.س</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                    <span>التكلفة / م² قبل الربح</span>
                    <span>{fmt(result.totals.cost_per_m2)} ر.س/م²</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>السعر / م² بعد الربح</span>
                    <span>{fmt(result.totals.area_m2 > 0 ? result.totals.final_price / result.totals.area_m2 : 0)} ر.س/م²</span>
                  </div>
                </div>
              </div>

              {insights && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                  <h3 className="font-bold text-white text-base flex items-center gap-2 mb-4">
                    <FlaskConical className="w-5 h-5 text-cyan-400" />
                    رؤى هندسية تخطيطية
                  </h3>
                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-slate-800/60 rounded-xl px-3 py-3">
                      <div className="text-[11px] text-slate-400 mb-1">حديد/خرسانة</div>
                      <div className="font-bold text-white">{insights.ratio.toFixed(0)} <span className="text-[10px] font-normal text-slate-400">كغ/م³</span></div>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl px-3 py-3">
                      <div className="text-[11px] text-slate-400 mb-1">التكلفة/م²</div>
                      <div className="font-bold text-white">{fmt(insights.perM2)} <span className="text-[10px] font-normal text-slate-400">ر.س</span></div>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl px-3 py-3">
                      <div className="text-[11px] text-slate-400 mb-1">التعقيد الإنشائي</div>
                      <div className="font-bold text-white">{insights.complexity}</div>
                    </div>
                  </div>
                  {insights.hints.length > 0 ? (
                    <div className="space-y-2">
                      {insights.hints.map((h, i) => (
                        <div key={i} className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                          h.level === 'warn'
                            ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
                            : 'bg-blue-950/40 border-blue-800/50 text-blue-300'
                        }`}>
                          {h.level === 'warn' ? <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 shrink-0 mt-0.5" />}
                          <span>{h.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl text-xs flex items-start gap-2 bg-emerald-950/40 border border-emerald-800/50 text-emerald-300">
                      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>المدخلات متوازنة — لا ملاحظات تخطيطية على هذا التقدير.</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 mt-3">تقديرات تخطيطية للمراجعة السريعة، وليست بديلًا عن التصميم الإنشائي المعتمد.</p>
                </div>
              )}
            </div>

            {result.market && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-white text-base">مقارنة أسعارك بالسوق</h3>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    result.market.risk === 'عالي'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : result.market.risk === 'متوسط'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    المخاطر: {result.market.risk}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[['concrete', 'الخرسانة', 'ر.س/م³'], ['steel', 'الحديد', 'ر.س/طن'], ['block', 'البلوك', 'ر.س']].map(([k, label, unit]) => {
                    const d = result.market.diffs_pct?.[k] ?? 0;
                    const color = Math.abs(d) > 15 ? 'text-red-400' : Math.abs(d) > 8 ? 'text-amber-400' : 'text-emerald-400';
                    return (
                      <div key={k} className="bg-slate-800/60 rounded-xl px-4 py-3 text-xs">
                        <div className="text-slate-400 mb-1">{label}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">المرجع: {fmt(result.market.refs?.[k])} {unit}</span>
                          <span className={`font-bold ${color}`} dir="ltr">{d > 0 ? '+' : ''}{d}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  تفصيل البنود
                </h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => downloadFile('excel')} disabled={!!exporting} className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 disabled:opacity-50 text-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    {exporting === 'excel' ? '...' : 'Excel'}
                  </button>
                  <button onClick={() => downloadFile('pdf')} disabled={!!exporting} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-50 text-red-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    {exporting === 'pdf' ? '...' : 'PDF'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 text-xs text-slate-400">
                      <th className="text-right py-3 px-4 font-semibold">البند</th>
                      <th className="text-right py-3 px-4 font-semibold">خرسانة (م³)</th>
                      <th className="text-right py-3 px-4 font-semibold">حديد (طن)</th>
                      <th className="text-right py-3 px-4 font-semibold">بلوك</th>
                      <th className="text-right py-3 px-4 font-semibold">المسطح (م²)</th>
                      <th className="text-right py-3 px-4 font-semibold">الإجمالي (ر.س)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {result.items.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 text-white font-semibold">{t.name}</td>
                        <td className="py-3 px-4 text-slate-300">{fmt(t.concrete_m3)}</td>
                        <td className="py-3 px-4 text-slate-300">{fmt(t.steel_tons, 3)}</td>
                        <td className="py-3 px-4 text-slate-300">{fmt(t.blocks)}</td>
                        <td className="py-3 px-4 text-purple-300">{fmt(t.area_m2)}</td>
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
