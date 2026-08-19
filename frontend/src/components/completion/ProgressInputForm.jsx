import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Building2, Layers, Wallet, Camera, Info,
  Upload, Trash2, Plus, X, CheckCircle2, Percent, Image as ImageIcon
} from 'lucide-react';
import {
  calcStructureProgress, calcFinishingProgress, calcSectorProgress, formatCurrency
} from './defaultCompletionData';

const Accordion = ({ title, icon: Icon, color, defaultOpen, children, badge, onDeleteSection, deleteSectionLabel = 'تفريغ / حذف القسم' }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="w-full flex items-center justify-between p-4 hover:bg-slate-800/40 transition">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center justify-between min-w-0 text-right"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-right min-w-0">
              <div className="text-sm font-bold text-white truncate">{title}</div>
              {badge && <div className="text-[11px] text-slate-400 truncate">{badge}</div>}
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform shrink-0 mr-3 ${open ? 'rotate-180' : ''}`} />
        </button>

        {onDeleteSection && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSection();
            }}
            title={deleteSectionLabel}
            className="px-2.5 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-bold transition flex items-center gap-1 shrink-0 ml-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">حذف القسم</span>
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-2 border-t border-slate-800 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProgressSlider = ({ value, onChange, color = 'blue' }) => {
  const val = parseFloat(value) || 0;
  const colorMap = {
    blue: 'accent-blue-500',
    emerald: 'accent-emerald-500',
    amber: 'accent-amber-500',
    purple: 'accent-purple-500',
  };
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min="0" max="100" step="1"
        value={val}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full ${colorMap[color]} cursor-pointer`}
      />
      <input
        type="number"
        min="0" max="100" step="1"
        value={val}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 text-center focus:border-blue-500 outline-none"
      />
      <span className="text-xs text-slate-500 w-4">%</span>
    </div>
  );
};

const AddItemRow = ({ placeholder, onAdd, extra }) => {
  const [name, setName] = useState('');
  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
  };
  return (
    <div className="flex items-center gap-2">
      <input
        type="text" value={name} placeholder={placeholder}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        className="flex-1 min-w-0 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition"
      />
      {extra}
      <button onClick={handleAdd} disabled={!name.trim()}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0">
        <Plus className="w-3.5 h-3.5" /> إضافة
      </button>
    </div>
  );
};

const ItemRow = ({ item, onChange, onRemove }) => {
  const isDone = (item.progress || 0) >= 100;
  return (
    <div className={`p-3 rounded-xl border transition ${isDone ? 'bg-emerald-950/30 border-emerald-700/40' : 'bg-slate-800/40 border-slate-700/50'}`}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span dir="ltr" className={`text-xs font-black font-mono ${isDone ? 'text-emerald-400' : (item.progress || 0) > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
            {item.progress || 0}%
          </span>
          {onRemove && (
            <button onClick={() => onRemove(item.id)} title="حذف البند"
              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <ProgressSlider
        value={item.progress}
        onChange={(v) => onChange(item.id, v)}
        color={isDone ? 'emerald' : 'blue'}
      />
    </div>
  );
};

export const ProgressInputForm = ({ data, setData }) => {
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [mainPhotoCaption, setMainPhotoCaption] = useState(data.mainPhoto?.caption || 'الصورة الرئيسية للموقع');
  const [newFinishingSector, setNewFinishingSector] = useState(data.finishingSectors[0]?.id || '');
  const [sectorError, setSectorError] = useState('');

  // ---- handlers ----
  const updateField = (field, value) => setData((d) => ({ ...d, [field]: value }));

  const updateStructure = (id, value) =>
    setData((d) => ({
      ...d,
      structureItems: d.structureItems.map((it) => (it.id === id ? { ...it, progress: value } : it)),
    }));

  const updateFinishing = (id, value) =>
    setData((d) => ({
      ...d,
      finishingItems: d.finishingItems.map((it) => (it.id === id ? { ...it, progress: value } : it)),
    }));

  const handleMainPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setData((d) => ({
        ...d,
        mainPhoto: {
          src: reader.result,
          caption: mainPhotoCaption || 'الصورة الرئيسية للموقع',
          title: 'الصورة الرئيسية للموقع',
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const updateMainPhotoCaption = (caption) => {
    setMainPhotoCaption(caption);
    if (data.mainPhoto) {
      setData((d) => ({
        ...d,
        mainPhoto: {
          ...(typeof d.mainPhoto === 'object' ? d.mainPhoto : { src: d.mainPhoto }),
          caption: caption,
          title: caption || 'الصورة الرئيسية للموقع',
        },
      }));
    }
  };

  const removeMainPhoto = () => {
    setData((d) => ({ ...d, mainPhoto: null }));
    setMainPhotoCaption('');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setPhotoCaption('');
    };
    reader.readAsDataURL(file);
  };

  const addPhoto = () => {
    if (!photoPreview) return;
    setData((d) => ({
      ...d,
      photoGallery: [...d.photoGallery, { id: `ph${Date.now()}`, src: photoPreview, caption: photoCaption || '' }],
    }));
    setPhotoPreview(null);
    setPhotoCaption('');
  };

  const removePhoto = (id) =>
    setData((d) => ({ ...d, photoGallery: d.photoGallery.filter((p) => p.id !== id) }));

  const updateSector = (id, value) =>
    setData((d) => ({
      ...d,
      finishingSectors: d.finishingSectors.map((s) => (s.id === id ? { ...s, progress: value } : s)),
    }));

  const updatePayment = (id, field, value) =>
    setData((d) => ({
      ...d,
      paymentsSchedule: d.paymentsSchedule.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));

  // ---- add / remove items ----
  const addStructure = (name) =>
    setData((d) => ({
      ...d,
      structureItems: [...d.structureItems, { id: `st${Date.now()}`, name, progress: 0 }],
    }));

  const removeStructure = (id) =>
    setData((d) => ({ ...d, structureItems: d.structureItems.filter((it) => it.id !== id) }));

  const addSector = (name) =>
    setData((d) => ({
      ...d,
      finishingSectors: [...d.finishingSectors, { id: `s${Date.now()}`, name, progress: 0 }],
    }));

  const removeSector = (id) => {
    setSectorError('');
    setData((d) => ({
      ...d,
      finishingSectors: d.finishingSectors.filter((s) => s.id !== id),
      finishingItems: d.finishingItems.filter((it) => it.sectorId !== id),
    }));
    if (newFinishingSector === id) {
      const remaining = data.finishingSectors.filter((s) => s.id !== id);
      setNewFinishingSector(remaining[0]?.id || '');
    }
  };

  const addFinishing = (name) =>
    setData((d) => ({
      ...d,
      finishingItems: [...d.finishingItems, { id: `f${Date.now()}`, name, progress: 0, sectorId: newFinishingSector }],
    }));

  const removeFinishing = (id) =>
    setData((d) => ({ ...d, finishingItems: d.finishingItems.filter((it) => it.id !== id) }));

  const addPayment = (name) =>
    setData((d) => ({
      ...d,
      paymentsSchedule: [
        ...d.paymentsSchedule,
        { id: `p${Date.now()}`, name, ratio: 0, contractorVal: 0, devVal: 0, totalVal: 0, paid: false, dueDate: '' },
      ],
    }));

  const removePayment = (id) =>
    setData((d) => ({ ...d, paymentsSchedule: d.paymentsSchedule.filter((p) => p.id !== id) }));

  // ---- clear / delete full sections ----
  const clearProjectInfo = () => {
    if (window.confirm('هل أنت متأكد من تفريغ بيانات وتفاصيل المشروع؟')) {
      setData((d) => ({
        ...d,
        projectName: '', projectType: '', projectNumber: '', location: '',
        unitsCount: 0, reportPeriod: '', docRef: '',
        contractDurationMonths: 0, actualDurationMonths: 0,
        contractorBudget: 0, developerBudget: 0, totalBudget: 0,
      }));
    }
  };

  const clearStructureItems = () => {
    if (window.confirm(`هل أنت متأكد من حذف جميع بنود أعمال العظم (${data.structureItems.length} بنداً) بالكامل؟`)) {
      setData((d) => ({ ...d, structureItems: [] }));
    }
  };

  const clearFinishingSection = () => {
    if (window.confirm(`هل أنت متأكد من حذف قسم التشطيبات بالكامل (جميع القطاعات الـ ${data.finishingSectors.length} وجميع البنود الـ ${data.finishingItems.length})؟`)) {
      setData((d) => ({ ...d, finishingSectors: [], finishingItems: [] }));
      setNewFinishingSector('');
    }
  };

  const clearPaymentsSchedule = () => {
    if (window.confirm(`هل أنت متأكد من حذف جميع مراحل جدول الدفعات (${data.paymentsSchedule.length} مراحل) بالكامل؟`)) {
      setData((d) => ({ ...d, paymentsSchedule: [] }));
    }
  };

  const clearPhotoGallery = () => {
    const totalCount = (data.mainPhoto ? 1 : 0) + data.photoGallery.length;
    if (window.confirm(`هل أنت متأكد من حذف وتفريغ جميع الصور (${totalCount} صورة) بالكامل؟`)) {
      setData((d) => ({ ...d, mainPhoto: null, photoGallery: [] }));
      setMainPhotoCaption('');
    }
  };

  const stProgress = calcStructureProgress(data.structureItems);
  const fnProgress = calcFinishingProgress(data.finishingItems);

  return (
    <div className="space-y-4">
      <Accordion
        title="بيانات وتفاصيل المشروع" icon={Info} color="bg-blue-500/10 text-blue-400"
        badge={`${data.projectNumber || '—'} — ${data.location || '—'}`} defaultOpen
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ['projectName', 'اسم المشروع'], ['projectType', 'نوع المشروع'],
            ['projectNumber', 'رقم المشروع'], ['location', 'الموقع'],
            ['unitsCount', 'عدد الوحدات'], ['reportPeriod', 'فترة التقرير'],
            ['docRef', 'مرجع الوثيقة'], ['contractDurationMonths', 'مدة العقد (شهر)'],
            ['actualDurationMonths', 'المنقضي (شهر)'], ['contractorBudget', 'ميزانية المقاول'],
            ['developerBudget', 'ميزانية المطور'], ['totalBudget', 'الميزانية الإجمالية'],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
              <input
                type={['unitsCount', 'contractDurationMonths', 'actualDurationMonths', 'contractorBudget', 'developerBudget', 'totalBudget'].includes(field) ? 'number' : 'text'}
                value={data[field]}
                onChange={(e) => updateField(field, e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none transition"
              />
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion
        title="بنود أعمال العظم" icon={Building2} color="bg-amber-500/10 text-amber-400"
        badge={`${data.structureItems.length} بنداً · متوسط الإنجاز: ${stProgress}%`} defaultOpen={false}
        onDeleteSection={clearStructureItems}
        deleteSectionLabel="حذف جميع بنود أعمال العظم بالكامل"
      >
        <AddItemRow placeholder="اسم بند جديد..." onAdd={addStructure} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {data.structureItems.map((it) => (
            <ItemRow key={it.id} item={it} onChange={updateStructure} onRemove={removeStructure} />
          ))}
        </div>
        {data.structureItems.length === 0 && (
          <div className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
            لا توجد بنود أعمال عظم — أضف بنداً جديداً أعلاه
          </div>
        )}
      </Accordion>

      <Accordion
        title="قطاعات التشطيبات الفرعية" icon={Layers} color="bg-purple-500/10 text-purple-400"
        badge={`${data.finishingSectors.length} قطاعات · تحكم سريع بنسبة كل قطاع`} defaultOpen={false}
        onDeleteSection={clearFinishingSection}
        deleteSectionLabel="حذف جميع قطاعات وبنود التشطيبات بالكامل"
      >
        <AddItemRow placeholder="اسم قطاع جديد..." onAdd={addSector} />
        {sectorError && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs">{sectorError}</div>
        )}
        {data.finishingSectors.map((sec) => {
          const actual = calcSectorProgress(sec.id, data.finishingItems);
          return (
            <div key={sec.id} className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200 truncate">{sec.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400">المحسوب: {actual}%</span>
                  <button onClick={() => removeSector(sec.id)} title="حذف القطاع"
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <ProgressSlider value={sec.progress} onChange={(v) => updateSector(sec.id, v)} color="purple" />
            </div>
          );
        })}
        {data.finishingSectors.length === 0 && (
          <div className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
            لا توجد قطاعات فرعية — أضف قطاعاً جديداً أعلاه
          </div>
        )}
      </Accordion>

      <Accordion
        title="بنود أعمال التشطيبات والقطاعات" icon={Layers} color="bg-teal-500/10 text-teal-400"
        badge={`${data.finishingSectors.length} قطاعات · ${data.finishingItems.length} بنداً · متوسط الإنجاز: ${fnProgress}%`} defaultOpen={true}
        onDeleteSection={clearFinishingSection}
        deleteSectionLabel="حذف جميع قطاعات وبنود التشطيبات بالكامل"
      >
        {/* شريط إضافة قطاع رئيسي جديد أو إضافة بند سريع */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span className="text-xs font-bold text-purple-300 shrink-0">إضافة قطاع جديد:</span>
            <AddItemRow placeholder="اسم القطاع الجديد (مثال: أعمال النجارة، الديكورات...)" onAdd={addSector} />
          </div>

          {data.finishingSectors.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-teal-300 shrink-0">إضافة بند للقطاع:</span>
              <AddItemRow
                placeholder="اسم بند تشطيب جديد..."
                onAdd={addFinishing}
                extra={
                  <select value={newFinishingSector} onChange={(e) => setNewFinishingSector(e.target.value)}
                    className="bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-2.5 py-2 text-xs text-slate-100 outline-none transition shrink-0 font-medium max-w-[180px] truncate">
                    {data.finishingSectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                }
              />
            </div>
          )}
        </div>

        {/* عرض كل قطاع وتحته بنوده مع زر حذف القطاع وزر إضافة بند خاص به */}
        {data.finishingSectors.map((sec) => {
          const items = data.finishingItems.filter((f) => f.sectorId === sec.id);
          const secProgress = calcSectorProgress(sec.id, data.finishingItems);
          return (
            <div key={sec.id} className="mb-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 space-y-3">
              {/* ترويسة القطاع مع زر حذفه بالكامل */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-xs font-bold text-purple-300 truncate">{sec.name}</span>
                  <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                    {items.length} بنود · {secProgress}%
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (window.confirm(`هل أنت متأكد من حذف قطاع "${sec.name}" بالكامل مع جميع بنوده (${items.length} بنود)؟`)) {
                        removeSector(sec.id);
                      }
                    }}
                    title="حذف هذا القطاع بالكامل مع بنوده"
                    className="px-2.5 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-bold transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف القطاع بالكامل</span>
                  </button>
                </div>
              </div>

              {/* بنود هذا القطاع */}
              {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {items.map((it) => (
                    <ItemRow key={it.id} item={it} onChange={updateFinishing} onRemove={removeFinishing} />
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 text-center py-2 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                  لا توجد بنود في هذا القطاع حتى الآن — أضف بنداً واختر "{sec.name}"
                </div>
              )}
            </div>
          );
        })}

        {data.finishingSectors.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
            لا توجد قطاعات تشطيبات حالياً — أضف قطاعاً جديداً من الحقل أعلاه
          </div>
        )}
      </Accordion>

      <Accordion
        title="جدول الدفعات والمستحقات" icon={Wallet} color="bg-emerald-500/10 text-emerald-400"
        badge={`${data.paymentsSchedule.length} مراحل · إجمالي: ${formatCurrency(data.totalBudget)} ر.س`} defaultOpen={false}
        onDeleteSection={clearPaymentsSchedule}
        deleteSectionLabel="حذف جميع مراحل جدول الدفعات بالكامل"
      >
        <AddItemRow placeholder="اسم مرحلة الدفعة..." onAdd={addPayment} />
        <div className="space-y-2">
          {data.paymentsSchedule.map((p) => (
            <div key={p.id} className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate">{p.name}</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Percent className="w-2.5 h-2.5 inline" />
                    <input type="number" min="0" max="100" step="0.5" value={p.ratio}
                      onChange={(e) => updatePayment(p.id, 'ratio', parseFloat(e.target.value) || 0)}
                      className="w-11 bg-transparent text-blue-400 text-[10px] font-bold text-center outline-none" />
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={p.paid} onChange={(e) => updatePayment(p.id, 'paid', e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" />
                    <span className={`text-[11px] font-semibold ${p.paid ? 'text-emerald-400' : 'text-slate-400'}`}>{p.paid ? 'مدفوع' : 'غير مدفوع'}</span>
                  </label>
                  <button onClick={() => removePayment(p.id)} title="حذف الدفعة"
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">قيمة المقاول</label>
                  <input type="number" value={p.contractorVal} onChange={(e) => updatePayment(p.id, 'contractorVal', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-100 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">قيمة المطور</label>
                  <input type="number" value={p.devVal} onChange={(e) => updatePayment(p.id, 'devVal', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-100 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">تاريخ الاستحقاق</label>
                  <input type="text" value={p.dueDate} placeholder="7/2025" onChange={(e) => updatePayment(p.id, 'dueDate', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-100 outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {data.paymentsSchedule.length === 0 && (
          <div className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
            لا توجد دفعات — أضف مرحلة جديدة أعلاه
          </div>
        )}
      </Accordion>

      <Accordion
        title="التوثيق المصور بالموقع" icon={Camera} color="bg-rose-500/10 text-rose-400"
        badge={`${(data.mainPhoto ? 1 : 0) + data.photoGallery.length} صورة`} defaultOpen={false}
        onDeleteSection={clearPhotoGallery}
        deleteSectionLabel="حذف جميع الصور المرفقة بالكامل"
      >
        <div className="space-y-6">
          {/* ── 1. الصورة الرئيسية (الصفحة الأولى) ── */}
          <div className="bg-slate-950/60 border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs font-mono">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-400">الصورة الرئيسية للمشروع (تظهر في الصفحة الأولى)</h4>
                  <p className="text-[10px] text-slate-400">تظهر هذه الصورة في صفحة الغلاف الأولى من التقرير كصورة مميزة وبارزة للموقع</p>
                </div>
              </div>
              {data.mainPhoto && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                  الصورة محددة ✓
                </span>
              )}
            </div>

            {data.mainPhoto?.src || (typeof data.mainPhoto === 'string' && data.mainPhoto) ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video max-h-48 group">
                  <img
                    src={data.mainPhoto.src || data.mainPhoto}
                    alt="Main Cover Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end justify-between p-3">
                    <span className="text-xs font-bold text-amber-300 truncate max-w-[70%]">
                      {data.mainPhoto.caption || 'الصورة الرئيسية للموقع'}
                    </span>
                    <button
                      type="button"
                      onClick={removeMainPhoto}
                      className="px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-lg shrink-0"
                      title="حذف الصورة الرئيسية"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-600 rounded-xl cursor-pointer text-xs text-slate-200 transition shrink-0">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>استبدال الصورة</span>
                    <input type="file" accept="image/*" onChange={handleMainPhotoSelect} className="hidden" />
                  </label>
                  <input
                    type="text"
                    value={mainPhotoCaption}
                    onChange={(e) => updateMainPhotoCaption(e.target.value)}
                    placeholder="تعليق الصورة الرئيسية..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/80 border border-dashed border-amber-500/30 rounded-xl flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">لا توجد صورة رئيسية محددة حالياً</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">ارفع صورة واجهة المشروع أو الموقع العام للظهور في الصفحة الأولى</div>
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl cursor-pointer text-xs font-black transition shadow-md mt-1">
                  <Upload className="w-4 h-4" />
                  <span>رفع الصورة الرئيسية للغلاف</span>
                  <input type="file" accept="image/*" onChange={handleMainPhotoSelect} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* ── 2. معرض صور الموقع (الصفحات اللاحقة) ── */}
          <div className="bg-slate-950/60 border border-rose-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-xs font-mono">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-400">معرض صور الموقع (صفحات التوثيق المصور اللاحقة)</h4>
                  <p className="text-[10px] text-slate-400">تظهر هذه الصور في صفحات المعرض الميداني (6 صور لكل صفحة تلقائياً)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700">
                {data.photoGallery.length} صور في المعرض
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 border border-dashed border-slate-700 rounded-xl">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer text-xs text-slate-300 transition">
                  <Upload className="w-4 h-4 text-rose-400" />
                  <span>اختر صورة للمعرض</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
                <input
                  type="text" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="تعليق توضيحي على الصورة..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-rose-500"
                />
                <button onClick={addPhoto} disabled={!photoPreview}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shrink-0">
                  <Plus className="w-4 h-4" /> إضافة للمعرض
                </button>
              </div>
              {photoPreview && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-700">
                  <img src={photoPreview} alt="preview" className="w-full max-h-36 object-cover" />
                  <button onClick={() => setPhotoPreview(null)} className="absolute top-2 left-2 p-1 bg-black/70 rounded-lg text-white hover:bg-black/90">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {data.photoGallery.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.photoGallery.map((ph, idx) => (
                  <div key={ph.id} className="relative group bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <img src={ph.src} alt={ph.caption} className="w-full h-24 object-cover" />
                    <div className="p-2 text-[10px] text-slate-300 truncate bg-slate-950 font-medium">
                      {ph.caption || `صورة ${idx + 1}`}
                    </div>
                    <button onClick={() => removePhoto(ph.id)}
                      className="absolute top-1.5 left-1.5 p-1 bg-red-600/90 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition shadow-md"
                      title="حذف من المعرض">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-xs text-slate-500">
                لا توجد صور في المعرض بعد — أضف صور سير العمل الميداني أعلاه
              </div>
            )}
          </div>
        </div>
      </Accordion>
    </div>
  );
};

export default ProgressInputForm;