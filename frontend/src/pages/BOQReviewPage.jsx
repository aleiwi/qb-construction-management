import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { boqElementsApi } from '../features/boq/boqApi';
import {
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Tag,
  CheckSquare, Square, X, Info, Brain, Loader2
} from 'lucide-react';

const ELEMENT_TYPES = [
  { key: 'wall', label: 'جدار', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { key: 'column', label: 'عمود', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { key: 'slab', label: 'بلاطة', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { key: 'beam', label: 'كمرة', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { key: 'foundation', label: 'أساس', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  { key: 'door', label: 'باب', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { key: 'window', label: 'نافذة', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { key: 'stairs', label: 'درج', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { key: 'roof', label: 'سقف', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { key: 'partition', label: 'فاصل', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { key: 'opening', label: 'فتحة', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { key: 'other', label: 'أخرى', color: 'bg-slate-600/10 text-slate-400 border-slate-600/20' },
];

const getTypeConfig = (type) => ELEMENT_TYPES.find(t => t.key === type) || ELEMENT_TYPES[ELEMENT_TYPES.length - 1];

const TypeButton = ({ type, onClick, selected }) => {
  const cfg = getTypeConfig(type);
  return (
    <button
      onClick={() => onClick(type)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${
        selected
          ? `${cfg.color} border-current`
          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-700/80 hover:text-slate-300'
      }`}
    >
      {selected && <CheckCircle2 className="w-3 h-3" />}
      {cfg.label}
    </button>
  );
};

export const BOQReviewPage = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [classifyingType, setClassifyingType] = useState(null);
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchUnclassified = useCallback(async () => {
    setLoading(true);
    try {
      const res = await boqElementsApi.unclassified(0, 200);
      if (res.success) setElements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUnclassified(); }, [fetchUnclassified]);

  const showSuccess = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === elements.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(elements.map(e => e.id)));
    }
  };

  const handleClassify = async (elementId, elementType) => {
    const res = await boqElementsApi.classify(elementId, {
      element_type: elementType,
      classification_status: 'manually_classified',
    });
    if (res.success) {
      setElements(prev => prev.filter(e => e.id !== elementId));
      setSelected(prev => { const next = new Set(prev); next.delete(elementId); return next; });
      showSuccess('تم تصنيف العنصر بنجاح');
    }
  };

  const handleBulkClassify = async () => {
    if (!classifyingType || selected.size === 0) return;
    const res = await boqElementsApi.bulkClassify(Array.from(selected), classifyingType);
    if (res.success) {
      showSuccess(`تم تصنيف ${res.data.count} عنصر بنجاح`);
      setSelected(new Set());
      setClassifyingType(null);
      fetchUnclassified();
    }
  };

  const groupedByLayer = elements.reduce((acc, el) => {
    const key = el.source_layer_name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(el);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="مراجعة العناصر غير المصنفة"
        subtitle="حدد النوع يدوياً لكل عنصر من القائمة"
        actions={
          <>
            <button
              onClick={async () => {
                setIsReclassifying(true);
                const res = await boqElementsApi.reclassifyAI(null, false, 500);
                if (res.success) showSuccess(`تم تصنيف ${res.data.classified} عنصر بـ AI`);
                fetchUnclassified();
                setIsReclassifying(false);
              }}
              disabled={isReclassifying}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition flex items-center gap-2 text-xs font-bold"
            >
              {isReclassifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
              <span>{isReclassifying ? 'جارٍ التصنيف...' : 'تصنيف تلقائي'}</span>
            </button>
            <button onClick={fetchUnclassified} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
            <button onClick={() => navigate('/drawings')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>المخططات</span>
            </button>
          </>
        }
      />

      <div className="space-y-6">
        {actionMsg && (
          <div className="p-4 rounded-2xl border flex items-center gap-3 text-sm bg-emerald-950/40 border-emerald-800/50 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{actionMsg}</span>
          </div>
        )}

        {/* Bulk Classification Toolbar */}
        {selected.size > 0 && (
          <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-indigo-300 font-semibold shrink-0">
              <CheckSquare className="w-4 h-4" />
              <span>{selected.size} محدد</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">تصنيف كـ:</span>
              {ELEMENT_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setClassifyingType(t.key)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                    classifyingType === t.key
                      ? `${t.color} border-current`
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-700/80'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {classifyingType && (
              <button
                onClick={handleBulkClassify}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 mr-auto"
              >
                <Tag className="w-3.5 h-3.5" />
                تطبيق التصنيف
              </button>
            )}
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 text-xs text-amber-300 flex items-start gap-3">
          <Brain className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">التصنيف التلقائي بالذكاء الاصطناعي</p>
            <p>يمكنك استخدام زر "تصنيف تلقائي" لتصنيف جميع العناصر غير المصنفة دفعة واحدة. العناصر التي لم يتم تصنيفها تلقائياً تنتظر مراجعتك اليدوية.</p>
          </div>
        </div>

        {/* Unclassified Count */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-3">
            <span className="text-2xl font-bold text-orange-400">{elements.length}</span>
            <span className="text-xs text-slate-400 mr-2">عنصر غير مصنف</span>
          </div>
          {elements.length > 0 && (
            <button onClick={toggleSelectAll} className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5">
              {selected.size === elements.length ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
              {selected.size === elements.length ? 'إلغاء التحديد' : 'تحديد الكل'}
            </button>
          )}
        </div>

        {loading && elements.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">جارٍ تحميل العناصر...</p>
            </div>
          </div>
        ) : elements.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-emerald-300 mb-2">لا توجد عناصر غير مصنفة</h3>
            <p className="text-sm text-slate-500">جميع العناصر المستخرجة مصنفة. يمكنك رفع مخططات جديدة.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByLayer).map(([layerName, layerElements]) => (
              <div key={layerName} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">{layerName}</span>
                  <span className="text-[10px] text-slate-500">{layerElements.length} عنصر</span>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {layerElements.map(el => {
                    const isSelected = selected.has(el.id);
                    return (
                      <div key={el.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition ${isSelected ? 'bg-indigo-950/20' : ''}`}>
                        <button
                          onClick={() => toggleSelect(el.id)}
                          className="shrink-0 text-slate-500 hover:text-indigo-400 transition"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-300">
                              #{el.id}
                            </span>
                            <span className="text-xs text-slate-500">
                              {el.quantity} {el.unit}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-600 font-mono">{el.source_layer_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {ELEMENT_TYPES.map(t => (
                            <button
                              key={t.key}
                              onClick={() => handleClassify(el.id, t.key)}
                              className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition ${
                                t.key === 'other'
                                  ? 'bg-slate-700/60 text-slate-400 border-slate-600/50 hover:bg-slate-600/80'
                                  : `${t.color} opacity-60 hover:opacity-100 border-transparent`
                              }`}
                              title={`تصنيف كـ ${t.label}`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};