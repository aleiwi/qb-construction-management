import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCalculator, FaSave, FaFilePdf, FaFileExcel, FaPlus, FaTrash,
  FaCopy, FaDownload, FaClock, FaSync, FaCloud, FaCheckCircle,
  FaBuilding, FaWrench, FaLayerGroup, FaChartBar, FaSearch,
  FaServer, FaSignal
} from 'react-icons/fa';
import { FaRobot } from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { usePdfGenerator } from '../../hooks/qb/usePdfGenerator';
import { useEngineeringCalculations } from "../../hooks/qb/useEngineeringCalculations";
import { useDebounce, useMemoAsync } from "../../hooks/qb/usePerformance";
import { useServerConnection } from "../../hooks/qb/useServerConnection";
import { calculateConcrete, calculateSteel, formatCurrency } from '../../utils/qb/calculations';
import { getSteelRatio, getConversionFactor, getPreArea, formatNumber } from '../../utils/qb/calculatorLogic';
import { concreteStandards, steelStandards } from '../../constants/qb/engineeringStandards';
import { ExcelExporter } from '../../utils/qb/advancedReports';
import api from '../../api/axios';

const CURRENCY = 'ر.س';
const itemNames = { foundation: 'بند أساسات', slab: 'بند سقف', column: 'بند عمود', wall: 'بند جدار', tank: 'بند خزان' };
const itemColors = { foundation: '#3B82F6', slab: '#10B981', column: '#F59E0B', wall: '#EF4444', tank: '#8B5CF6' };
const STORAGE_KEY = 'qb_cost_calculator_draft';
const ENGINEERING_KEY = 'qb_cost_calculator_engineering';

const CostCalculatorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'new';
  const projectId = searchParams.get('projectId');

  const { generatePdf } = usePdfGenerator();
  const { calculations, steelAnalysis } = useEngineeringCalculations();

  const gridClass = "grid-cols-1 lg:grid-cols-4";

  const [projectData, setProjectData] = useState({
    name: '', location: '', area: '', floors: '',
    concretePrice: '', steelPrice: '', blockPrice: '', plasterPrice: '',
    laborRate: '', equipmentRate: '', profitRate: ''
  });
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('foundation');
  const [activeTab, setActiveTab] = useState('calculator');
  const [saving, setSaving] = useState(false);
  const debouncedProjectData = useDebounce(projectData, 500);
  const debouncedItems = useDebounce(items, 500);
  // Theme context provided by ThemeProvider
  const themeContext = useTheme();
  const isDark = themeContext?.isDark ?? false;
  const toggleTheme = themeContext?.toggle ?? (() => {});
  const { isConnected, checkConnection } = useServerConnection();
  const [engineerMode, setEngineerMode] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [isArabic, setIsArabic] = useState(false);

  // Load draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { const parsed = JSON.parse(saved); setProjectData(prev => ({ ...prev, ...parsed.projectData })); setItems(parsed.items || []); }
      const engSaved = localStorage.getItem(ENGINEERING_KEY);
      if (engSaved) setEngineerMode(JSON.parse(engSaved));
    } catch (e) {}
  }, []);

  // Auto-save draft (debounced)
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ projectData, items }));
      }, 1000);
      return () => clearTimeout(timer);
    } catch (e) {}
  }, [debouncedProjectData, debouncedItems]);

  // Load BOQ summary from backend
  const loadBoqSummary = useCallback(async (pid) => {
    try {
      const res = await api.get('/boq-summary/project/' + pid);
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        if (data.items) setItems(data.items);
        if (data.summary) {
          setProjectData(prev => ({ ...prev, name: data.name || prev.name, area: data.area || prev.area }));
        }
        toast.success('تم تحميل بيانات BOQ');
      }
    } catch (e) {}
  }, []);

  // Load project
  useEffect(() => {
    if (mode === 'edit' && projectId) {
      (async () => { try { const res = await api.get(`/projects/${projectId}`); if (res.data.success) setProjectData(res.data.data); } catch (e) {} })();
    }
  }, [mode, projectId]);

  // Item management
  const addItem = useCallback(() => {
    const newItem = { id: Date.now(), type: selectedItem, name: itemNames[selectedItem], quantity: 1, unit: 'م3', price: parseFloat(projectData[`${selectedItem}Price`] || 0), steelRatio: getSteelRatio(selectedItem), concreteVolume: 0, steelWeight: 0, color: itemColors[selectedItem] };
    setItems(prev => [...prev, newItem]);
    toast.success(`تم إضافة ${itemNames[selectedItem]}`);
  }, [selectedItem, projectData]);

  const removeItem = useCallback((id) => { setItems(prev => prev.filter(item => item.id !== id)); toast('تم حذف البند', { icon: '🗑️' }); }, []);
  const updateItem = useCallback((id, field, value) => { setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item)); }, []);

  // Recalculate
  const recalculate = useCallback(() => {
    setItems(prev => prev.map(item => {
      const sr = getSteelRatio(item.type);
      const cf = getConversionFactor(item.type);
      const cv = calculateConcrete(item.length || 1, item.width || 1, item.height || 1);
      const sw = calculateSteel(item.length || 1, item.width || 1, sr);
      return { ...item, steelRatio: sr, concreteVolume: cv.volume, steelWeight: sw.weight, totalPrice: (item.quantity || 1) * (item.price || 0) * (item.concreteVolume || 1) * cf };
    }));
  }, []);

  useEffect(() => { recalculate(); }, [items]);

  // Summary
  const summary = useMemo(() => {
    const totalPrice = items.reduce((s, i) => s + (i.totalPrice || 0), 0);
    const totalSteel = items.reduce((s, i) => s + (i.steelWeight || 0), 0);
    const totalConcrete = items.reduce((s, i) => s + (i.concreteVolume || 0), 0);
    const profitRate = parseFloat(projectData.profitRate) || 0.15;
    const profit = totalPrice * profitRate;
    const byType = {};
    items.forEach(item => { if (!byType[item.type]) byType[item.type] = { qty: 0, price: 0, color: itemColors[item.type] }; byType[item.type].qty += item.quantity || 0; byType[item.type].price += item.totalPrice || 0; });
    return { totalPrice, totalSteel, totalConcrete, profit, grandTotal: totalPrice + profit, byType, profitRate, totalQuantity: items.length };
  }, [items, projectData.profitRate]);

  // Actions
  const handleGeneratePdf = useCallback(async () => { try { await generatePdf({ projectData, items, summary }); toast.success('تم إنشاء PDF'); } catch (e) { toast.error('فشل إنشاء PDF'); } }, [generatePdf, projectData, items, summary]);
  const handleExportExcel = useCallback(() => { try { const data = items.map(item => ({ 'البند': item.name, 'الكمية': item.quantity, 'السعر': item.price, 'الإجمالي': item.totalPrice })); ExcelExporter.exportToExcel(data, `cost_estimate_${projectData.name || 'project'}`); toast.success('تم تصدير Excel'); } catch (e) { toast.error('فشل تصدير Excel'); } }, [items, projectData.name]);
  const handleCopySummary = useCallback(async () => { const text = `تقرير التكاليف - ${projectData.name || 'المشروع'}\nالإجمالي: ${formatCurrency(summary.grandTotal)} ${CURRENCY}\nالربح: ${formatCurrency(summary.profit)} ${CURRENCY}\nالحديد: ${summary.totalSteel.toFixed(2)} طن\nالخرسانة: ${summary.totalConcrete.toFixed(2)} م3`; try { await navigator.clipboard.writeText(text); toast.success('تم النسخ'); } catch (e) { toast.error('فشل النسخ'); } }, [projectData.name, summary]);
  const handleServerCalculate = async () => {
    try {
      const res = await api.post('/estimate/calculate', { projectData, items });
      if (res.data.success) {
        toast.success('تم الحساب على الخادم');
        // Update summary with server response
        if (res.data.data.summary) {
          setProjectData(prev => ({ ...prev, ...res.data.data.summary }));
        }
      }
    } catch (e) {
      toast.error('فشل الحساب على الخادم');
    }
  };
  const handleSave = useCallback(async () => { setSaving(true); try { const res = await api.post('/projects', { ...projectData, items, summary, engineerMode }); if (res.data.success) { toast.success('تم الحفظ'); localStorage.removeItem(STORAGE_KEY); } } catch (e) { toast.error('فشل الحفظ'); } finally { setSaving(false); } }, [projectData, items, summary, engineerMode]);

  useEffect(() => {  }, [items.length]);

  // Tabs
  const renderContent = () => {
    switch (activeTab) {
      case 'calculator': return (
        <div className={`${gridClass} gap-4`}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2"><FaBuilding className="text-blue-500" /> معلومات المشروع</h3>
            {[
              { key: 'name', label: 'اسم المشروع' }, { key: 'location', label: 'الموقع' },
              { key: 'area', label: 'المساحة (م2)' }, { key: 'floors', label: 'الطوابق' }
            ].map(field => (
              <div key={field.key} className="mb-2"><label className="text-[10px] text-slate-500 mb-1 block">{field.label}</label>
                <input type="text" value={projectData[field.key] || ''} onChange={e => setProjectData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2"><FaWrench className="text-green-500" /> أسعار المواد</h3>
            {[
              { key: 'concretePrice', label: 'سعر الخرسانة' }, { key: 'steelPrice', label: 'سعر الحديد' },
              { key: 'blockPrice', label: 'سعر الكتل' }, { key: 'profitRate', label: 'نسبة الربح %' }
            ].map(field => (
              <div key={field.key} className="mb-2"><label className="text-[10px] text-slate-500 mb-1 block">{field.label}</label>
                <input type="number" value={projectData[field.key] || ''} onChange={e => setProjectData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2"><FaLayers className="text-purple-500" /> إضافة بند</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {Object.entries(itemNames).map(([key, name]) => (
                <button key={key} onClick={() => setSelectedItem(key)}
                  className={`px-2 py-2 rounded-lg text-[10px] font-medium transition ${selectedItem === key ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                  style={{ background: selectedItem === key ? `${itemColors[key]}20` : '#f8fafc', color: itemColors[key], border: `1px solid ${itemColors[key]}40` }}>
                  <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: itemColors[key] }} />{name}
                </button>
              ))}
            </div>
            <button onClick={addItem}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              <FaPlus /> إضافة {itemNames[selectedItem]}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2"><FaChartBar className="text-amber-500" /> البنود ({items.length})</h3>
            {items.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">لا توجد بنود بعد</p> : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ background: item.color }} /><span className="text-xs text-slate-700 dark:text-slate-200">{item.name}</span></div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={item.quantity || 1} onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)} className="w-16 bg-transparent border-b border-slate-300 text-xs text-center py-0.5" />
                      <span className="text-[10px] text-slate-500">{item.unit}</span>
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><FaTrash className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

      case 'engineering': return (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><FaWrench className="text-blue-500" /> الحسابات الهندسية المتقدمة</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3"><p className="text-[10px] text-blue-600 dark:text-blue-400">إجمالي الحديد</p><p className="text-xl font-bold text-blue-700 dark:text-blue-300">{summary.totalSteel.toFixed(2)} طن</p></div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3"><p className="text-[10px] text-green-600 dark:text-green-400">إجمالي الخرسانة</p><p className="text-xl font-bold text-green-700 dark:text-green-300">{summary.totalConcrete.toFixed(2)} م3</p></div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3"><p className="text-[10px] text-purple-600 dark:text-purple-400">عدد البنود</p><p className="text-xl font-bold text-purple-700 dark:text-purple-300">{summary.totalQuantity}</p></div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3"><p className="text-[10px] text-amber-600 dark:text-amber-400">نسبة الربح</p><p className="text-xl font-bold text-amber-700 dark:text-amber-300">{(summary.profitRate * 100).toFixed(1)}%</p></div>
            </div>
            {engineerMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4"><h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">معايير الخرسانة</h4>
                  <div className="space-y-1">{Object.entries(concreteStandards.mixDesign || {}).slice(0, 4).map(([grade, mix]) => (<div key={grade} className="flex justify-between text-[10px]"><span className="text-slate-600 dark:text-slate-400">{grade}</span><span className="text-slate-500">{mix.ratio}</span></div>))}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4"><h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">أقطاب الحديد</h4>
                  <div className="space-y-1">{Object.entries(steelStandards.diameters || {}).slice(0, 4).map(([dia, data]) => (<div key={dia} className="flex justify-between text-[10px]"><span className="text-slate-600 dark:text-slate-400">{dia}mm</span><span className="text-slate-500">{data.area?.toFixed(3) || '-'} سم2</span></div>))}</div>
                </div>
              </div>
            )}
            <button onClick={() => { setEngineerMode(!engineerMode); localStorage.setItem(ENGINEERING_KEY, !engineerMode); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${engineerMode ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
              {engineerMode ? '🔓 وضع المهندس مفعل' : '🔒 تفعيل وضع المهندس'}
            </button>
          </div>

          {items.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">توزيع التكاليف</h4>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={Object.entries(summary.byType).map(([type, data]) => ({ name: itemNames[type] || type, value: data.price, color: data.color }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {Object.entries(summary.byType).map(([type, data], i) => (<Cell key={i} fill={data.color} />))}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer></div>
            </div>
          )}
        </div>
      );

      case 'preview': return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">معاينة التقرير</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'إجمالي الكميات', value: summary.totalQuantity, color: 'text-slate-700' },
              { label: 'إجمالي التكاليف', value: formatCurrency(summary.totalPrice), color: 'text-blue-600' },
              { label: 'الربح المتوقع', value: formatCurrency(summary.profit), color: 'text-green-600' },
              { label: 'الإجمالي النهائي', value: formatCurrency(summary.grandTotal), color: 'text-purple-600' }
            ].map((stat, i) => (<div key={i} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4"><p className="text-[10px] text-slate-500 mb-1">{stat.label}</p><p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p></div>))}
          </div>
        </div>
      );

      case 'elements': return (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">تصنيف عناصر المشروع</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={async () => { try { const res = await api.post('/boq-elements/classify', { projectId }); if (res.data.success) toast.success('تم التصنيف تلقائياً'); } catch (e) { toast.error('فشل التصنيف'); } }}
              className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 text-left hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
              <FaWrench className="text-blue-500 text-xl mb-2" /><h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">تصنيف تلقائي</h4>
              <p className="text-xs text-slate-500 mt-1">تصنيف عناصر المشروع تلقائياً بناءً على الرسومات</p>
            </button>
            <button onClick={async () => { try { const res = await api.get('/boq-elements/stats?project_id=' + projectId); if (res.data.success) toast.success('إجمالي العناصر: ' + res.data.data.total); } catch (e) {} }}
              className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700 text-left hover:bg-green-100 dark:hover:bg-green-900/40 transition">
              <FaChartBar className="text-green-500 text-xl mb-2" /><h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">إحصائيات</h4>
              <p className="text-xs text-slate-500 mt-1">عرض إحصائيات عناصر المشروع</p>
            </button>
          </div>
          <button onClick={() => loadBoqSummary(projectId)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition">
            <FaSync className="inline mr-1" /> تحديث البيانات
          </button>
        </div>
          <TaskManager projectId={projectId} />
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200 ${containerClass}`}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><FaCalculator className="text-blue-500" /> حاسبة التكاليف</h1>
          <p className="text-xs text-slate-500 mt-1">{projectData.name || 'مشروع جديد'} • {items.length} بند • خادم: {isConnected ? 'متصل' : 'غير متصل'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={checkConnection} className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition"><FaServer className={`w-4 h-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} /></button>
          <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{breakpoint}</span>
            <button onClick={() => setIsArabic(!isArabic)} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-semibold transition">{isArabic ? "EN" : "عربي"}</button>
        </div>
      </motion.div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'calculator', label: 'الحاسبة', icon: <FaCalculator /> },
          { key: 'engineering', label: 'هندسي', icon: <FaWrench /> },
          { key: 'preview', label: 'المعاينة', icon: <FaChartBar /> }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="text-sm"><span className="text-slate-500">الإجمالي:</span><span className="text-lg font-bold text-blue-600 ml-2">{formatCurrency(summary.grandTotal)}</span></div>
            <div className="text-sm"><span className="text-slate-500">الربح:</span><span className="text-lg font-bold text-green-600 ml-2">{formatCurrency(summary.profit)}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopySummary} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs hover:bg-slate-200 transition flex items-center gap-1"><FaCopy /> نسخ</button>
            <button onClick={handleExportExcel} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"><FaFileExcel /> Excel</button>
            <button onClick={handleGeneratePdf} className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"><FaFilePdf /> PDF</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"><FaSave /> {saving ? 'جارِ...' : 'حفظ'}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// SmartAssistant floating widget
const SmartAssistantWidget = ({ projectId }) => {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([{ text: 'مرحبا! انا المساعد الذكي', sender: 'ai' }]);
  const [input, setInput] = useState('');
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    try { const res = await api.post('/ai/chat', { message: userMsg, projectId }); if (res.data.success) setMessages(prev => [...prev, { text: res.data.reply, sender: 'ai' }]); } catch (e) {}
  };
  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!showChat && <button onClick={() => setShowChat(true)} className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"><FaRobot className="w-6 h-6" /></button>}
      {showChat && <div className="w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border overflow-hidden">
        <div className="bg-blue-600 text-white px-4 py-3 flex justify-between"><span className="font-semibold text-sm">المساعد الذكي</span><button onClick={() => setShowChat(false)}>✕</button></div>
        <div className="h-64 overflow-y-auto p-3">{messages.map((m, i) => <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}><span className={`px-3 py-2 rounded-lg text-xs max-w-xs ${m.sender === 'user' ? 'bg-blue-100' : 'bg-slate-100'}`}>{m.text}</span></div>)}</div>
        <div className="flex border-t p-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1 bg-slate-50 rounded-lg px-3 py-1.5 text-xs" placeholder="اكتب رسالة..." /><button onClick={sendMessage} className="ml-2 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs">إرسال</button></div>
      </div>}
    </div>
  );
};

const CostCalculatorPageWithWidget = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  return <><CostCalculatorPage /><SmartAssistantWidget projectId={projectId} /></>;
};

export default CostCalculatorPageWithWidget;
