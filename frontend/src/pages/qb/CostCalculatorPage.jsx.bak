import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaCalculator, FaSave, FaFilePdf, FaFileExcel, FaPlus, FaTrash, FaCopy, FaDownload, FaClock } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePdfGenerator } from '../../hooks/qb/usePdfGenerator';
import { isEmpty } from '../../utils/qb/validation';
import api from '../../api/axios';

const CURRENCY = 'ريال';

const itemNames = { foundation: 'بند أساسات', slab: 'بند سقف', column: 'بند عمود', wall: 'بند جدار', tank: 'بند خزان' };
const itemColors = { foundation: '#3B82F6', slab: '#10B981', column: '#F59E0B', wall: '#EF4444', tank: '#8B5CF6' };
const STORAGE_KEY = 'qb_cost_calculator_draft';

const CostCalculatorPage = () => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'new';
  const projectId = urlParams.get('projectId');
  const { generatePdf } = usePdfGenerator();

  const [projectData, setProjectData] = useState({
    name: '', description: '', location: '', startDate: '', endDate: '',
    projectType: '', area: '', floors: '',
    concretePrice: '', steelPrice: '', blockPrice: '', plasterPrice: '',
    laborRate: '', equipmentRate: '', profitRate: ''
  });

  const [items, setItems] = useState([{ id: 1, type: 'foundation', name: '', length: '', width: '', thickness: '', concreteQty: 0, steelQty: 0, blockQty: 0, totalCost: 0 }]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  useEffect(() => {
    try { const draft = localStorage.getItem(STORAGE_KEY); if (draft) { const parsed = JSON.parse(draft); if (parsed.projectData) setProjectData(parsed.projectData); if (parsed.items) setItems(parsed.items); if (parsed.results) setResults(parsed.results); } } catch (e) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ projectData, items, results })); } catch (e) {}
  }, [projectData, items, results]);

  useEffect(() => { if (mode === 'edit' && projectId) loadProjectData(); }, [mode, projectId]);

  const loadProjectData = async () => {
    try { setLoading(true); const response = await api.get(`/projects/${projectId}`); const project = response.data; setProjectData({ name: project.name || '', description: project.description || '', location: project.location || '', projectType: project.project_type || '', area: project.area?.toString() || '', floors: project.floors?.toString() || '', concretePrice: project.concrete_price?.toString() || '', steelPrice: project.steel_price?.toString() || '', blockPrice: project.block_price?.toString() || '', plasterPrice: project.plaster_price?.toString() || '', laborRate: project.labor_rate?.toString() || '', equipmentRate: project.equipment_rate?.toString() || '', profitRate: project.profit_rate?.toString() || '' }); } catch (err) { toast.error('فشل تحميل بيانات المشروع'); } finally { setLoading(false); }
  };

  const handleInputChange = (field, value) => {
    if (['area','floors','concretePrice','steelPrice','blockPrice','plasterPrice','laborRate','equipmentRate','profitRate'].includes(field) && value !== '' && isNaN(Number(value))) return;
    setProjectData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const calculateItem = useCallback((item) => {
    const length = parseFloat(item.length) || 0;
    const width = parseFloat(item.width) || 0;
    const thickness = parseFloat(item.thickness) || 0;
    const concretePrice = parseFloat(projectData.concretePrice) || 0;
    const steelPrice = parseFloat(projectData.steelPrice) || 0;
    const blockPrice = parseFloat(projectData.blockPrice) || 0;
    const area = length * width;
    const volume = area * thickness;
    let concreteQty = 0, steelQty = 0, blockQty = 0;
    switch (item.type) { case 'foundation': concreteQty = volume; steelQty = volume * 100; break; case 'slab': concreteQty = volume; steelQty = volume * 80; break; case 'column': concreteQty = volume; steelQty = volume * 150; break; case 'wall': blockQty = area * 12.5; concreteQty = area * 0.05; break; case 'tank': concreteQty = volume; steelQty = volume * 120; break; default: concreteQty = volume; steelQty = volume * 100; }
    const totalCost = concreteQty * concretePrice + steelQty * steelPrice + blockQty * blockPrice;
    return { ...item, concreteQty: concreteQty.toFixed(2), steelQty: steelQty.toFixed(2), blockQty: blockQty.toFixed(2), totalCost: totalCost.toFixed(2) };
  }, [projectData]);

  const calculateAll = () => {
    const updatedItems = items.map(item => calculateItem(item));
    setItems(updatedItems);
    const totals = updatedItems.reduce((acc, item) => { acc.concreteQty += parseFloat(item.concreteQty) || 0; acc.steelQty += parseFloat(item.steelQty) || 0; acc.blockQty += parseFloat(item.blockQty) || 0; acc.totalCost += parseFloat(item.totalCost) || 0; return acc; }, { concreteQty: 0, steelQty: 0, blockQty: 0, totalCost: 0 });
    const contractorCost = totals.totalCost * 0.3;
    const overhead = totals.totalCost * 0.15;
    const concreteInsulation = totals.concreteQty * 50;
    const areaInsulation = (totals.concreteQty / 0.3) * 25;
    const profit = totals.totalCost * (parseFloat(projectData.profitRate) / 100);
    const finalPrice = (totals.totalCost + contractorCost + overhead + concreteInsulation + areaInsulation + profit).toFixed(2);
    setResults({ ...totals, contractorCost: contractorCost.toFixed(2), overhead: overhead.toFixed(2), concreteInsulation: concreteInsulation.toFixed(2), areaInsulation: areaInsulation.toFixed(2), profit: profit.toFixed(2), finalPrice });
    setSaved(false);
    toast.success('تم حساب التكاليف بنجاح');
  };

  const addItem = (type) => { setItems([...items, { id: Date.now(), type, name: '', length: '', width: '', thickness: '', concreteQty: 0, steelQty: 0, blockQty: 0, totalCost: 0 }]); };
  const requestDelete = (id) => { setShowConfirmDelete(id); };
  const confirmDelete = (id) => { if (items.length > 1) setItems(items.filter(item => item.id !== id)); setShowConfirmDelete(null); };
  const cancelDelete = () => { setShowConfirmDelete(null); };

  const updateItem = (id, field, value) => { setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item)); };

  const saveProject = async () => {
    try { setLoading(true); const payload = { name: projectData.name, description: projectData.description, location: projectData.location, project_type: projectData.projectType, area: parseFloat(projectData.area) || 0, floors: parseInt(projectData.floors) || 0, concrete_price: parseFloat(projectData.concretePrice) || 0, steel_price: parseFloat(projectData.steelPrice) || 0, block_price: parseFloat(projectData.blockPrice) || 0, plaster_price: parseFloat(projectData.plasterPrice) || 0, labor_rate: parseFloat(projectData.laborRate) || 0, equipment_rate: parseFloat(projectData.equipmentRate) || 0, profit_rate: parseFloat(projectData.profitRate) || 15 }; if (mode === 'edit' && projectId) { await api.put(`/projects/${projectId}`, payload); toast.success('تم تحديث المشروع'); } else { await api.post('/projects', payload); toast.success('تم إنشاء المشروع'); } setSaved(true); navigate('/projects'); } catch (err) { toast.error('فشل حفظ المشروع'); } finally { setLoading(false); }
  };

  const handleExportPdf = () => {
    if (!results) { toast.error('يرجى حساب التكاليف أولاً'); return; }
    try { generatePdf(projectData, { projectLocation: projectData.location, projectType: projectData.projectType, startDate: projectData.startDate, status: 'planning' }, items, results); toast.success('تم تصدير تقرير PDF بنجاح'); } catch (err) { toast.error('فشل تصدير PDF'); }
  };

  const copyResults = () => {
    if (!results) return;
    const text = `تقرير تكاليف المشروع: ${projectData.name}\nالإجمالي: ${results.finalPrice} ${CURRENCY}\nالمواد: ${results.totalCost}\nالمقاول: ${results.contractorCost}\nالمصاريف: ${results.overhead}\nالربح: ${results.profit}\nالخرسانة: ${results.concreteQty} م³\nالحديد: ${results.steelQty} كجم\nالبلوك: ${results.blockQty} قطعة`;
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ النتائج');
  };

  const clearAll = () => { setItems([{ id: 1, type: 'foundation', name: '', length: '', width: '', thickness: '', concreteQty: 0, steelQty: 0, blockQty: 0, totalCost: 0 }]); setResults(null); setProjectData({ name: '', description: '', location: '', startDate: '', endDate: '', projectType: '', area: '', floors: '', concretePrice: '', steelPrice: '', blockPrice: '', plasterPrice: '', laborRate: '', equipmentRate: '', profitRate: '' }); localStorage.removeItem(STORAGE_KEY); toast.info('تم مسح الحساب'); };

  const chartData = results ? [{ name: 'الخرسانة', cost: parseFloat(results.concreteQty) * parseFloat(projectData.concretePrice || 0) }, { name: 'الحديد', cost: parseFloat(results.steelQty) * parseFloat(projectData.steelPrice || 0) }, { name: 'البلوك', cost: parseFloat(results.blockQty) * parseFloat(projectData.blockPrice || 0) }, { name: 'المقاول', cost: parseFloat(results.contractorCost) }, { name: 'المصاريف', cost: parseFloat(results.overhead) }].filter(d => d.cost > 0) : [];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center"><FaCalculator className="ml-3 text-blue-600" /> حاسبة التكاليف</h1>
          <p className="text-lg text-orange-600 text-center">{projectData.name || 'مشروع جديد'}</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">إعدادات المشروع</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم المشروع</label><input type="text" value={projectData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="اسم المشروع" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label><input type="text" value={projectData.location} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="الموقع" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-sm text-gray-600 mb-1">المساحة (م²)</label><input type="number" value={projectData.area} onChange={(e) => handleInputChange('area', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">الأدوار</label><input type="number" value={projectData.floors} onChange={(e) => handleInputChange('floors', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <hr className="my-3" />
                <h4 className="font-medium text-gray-700 text-sm">أسعار المواد</h4>
                {[{ key: 'concretePrice', label: 'سعر الخرسانة (ريال/م³)' }, { key: 'steelPrice', label: 'سعر الحديد (ريال/كجم)' }, { key: 'blockPrice', label: 'سعر البلوك (ريال/قطعة)' }].map(f => (<div key={f.key}><label className="block text-sm text-gray-600 mb-1">{f.label}</label><input type="number" value={projectData[f.key]} onChange={(e) => handleInputChange(f.key, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>))}
                <hr className="my-3" />
                <div><label className="block text-sm font-medium text-gray-700 mb-1">هامش الربح (%)</label><input type="number" value={projectData.profitRate} onChange={(e) => handleInputChange('profitRate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="mt-6"><button onClick={clearAll} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2"><FaTrash className="text-xs" /> مسح الحساب</button></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-xl font-semibold text-gray-800">بنود المشروع</h3>
                <div className="flex gap-2 flex-wrap">
                  {['foundation', 'slab', 'column', 'wall', 'tank'].map(type => (<button key={type} onClick={() => addItem(type)} className="text-white px-3 py-1 rounded-md text-sm hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm" style={{ backgroundColor: itemColors[type] }}><FaPlus className="text-xs" /> {itemNames[type]}</button>))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead><tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">النوع</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الطول (م)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">العرض (م)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">السُمك (م)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الخرسانة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحديد</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">البلوك</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التكلفة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">إجراء</th>
                  </tr></thead>
                  <tbody>
                    {items.map(item => (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: itemColors[item.type] }}>{itemNames[item.type]}</td>
                        <td className="px-4 py-3"><input type="number" step="0.01" value={item.length} onChange={(e) => updateItem(item.id, 'length', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" /></td>
                        <td className="px-4 py-3"><input type="number" step="0.01" value={item.width} onChange={(e) => updateItem(item.id, 'width', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" /></td>
                        <td className="px-4 py-3"><input type="number" step="0.01" value={item.thickness} onChange={(e) => updateItem(item.id, 'thickness', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" /></td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{item.concreteQty || 0} م³</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{item.steelQty || 0} كجم</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{item.blockQty || 0} قطعة</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">{item.totalCost} {CURRENCY}</td>
                        <td className="px-4 py-3">
                          {showConfirmDelete === item.id ? (
                            <div className="flex gap-1"><button onClick={() => confirmDelete(item.id)} className="text-green-600 hover:text-green-700 text-xs px-1">تأكيد</button><button onClick={cancelDelete} className="text-gray-400 hover:text-gray-600 text-xs px-1">إلغاء</button></div>
                          ) : <button onClick={() => requestDelete(item.id)} className="text-red-500 hover:text-red-700 transition-colors"><FaTrash /></button>}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <button onClick={calculateAll} disabled={loading} className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm text-sm font-medium"><FaCalculator className="mr-2" /> {loading ? 'جاري...' : 'حساب التكاليف'}</button>
                <button onClick={saveProject} disabled={loading} className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm text-sm font-medium"><FaSave className="mr-2" /> حفظ المشروع</button>
                {saved && <span className="text-green-600 text-sm flex items-center gap-1 self-center"><FaClock className="text-xs" /> تم الحفظ</span>}
              </div>
            </div>

            {chartData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">توزيع التكاليف</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px' }} /><Legend /><Bar dataKey="cost" fill="#3B82F6" name={CURRENCY} radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {results && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'الخرسانة', value: `${results.concreteQty} م³`, color: 'blue' },
                    { label: 'الحديد', value: `${results.steelQty} كجم`, color: 'green' },
                    { label: 'البلوك', value: `${results.blockQty} قطعة`, color: 'yellow' },
                    { label: 'المجموع', value: results.totalCost, color: 'purple' },
                    { label: 'الإجمالي', value: results.finalPrice, color: 'red' },
                  ].map((item, i) => (
                    <div key={i} className={`bg-${item.color}-50 p-4 rounded-lg text-center shadow-sm`}><p className="text-xs text-gray-600 mb-1">{item.label}</p><p className={`text-xl font-bold text-${item.color}-900`}>{item.value}</p></div>
                  ))}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">التكاليف التفصيلية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><h4 className="font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">تكاليف مباشرة</h4>
                      <div className="space-y-2">
                        {[
                          { label: 'تكلفة المواد', value: `${results.totalCost} ${CURRENCY}` },
                          { label: 'مقاول المصنعيات', value: `${results.contractorCost} ${CURRENCY}` },
                          { label: 'المصاريف الإدارية', value: `${results.overhead} ${CURRENCY}` },
                        ].map((item, i) => (<div key={i} className="flex justify-between py-1"><span className="text-gray-600 text-sm">{item.label}</span><span className="font-medium text-sm">{item.value}</span></div>))}
                      </div>
                    </div>
                    <div><h4 className="font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">تكاليف إضافية</h4>
                      <div className="space-y-2">
                        {[
                          { label: 'عزل الخرسانة', value: `${results.concreteInsulation} ${CURRENCY}` },
                          { label: 'عزل المساحات', value: `${results.areaInsulation} ${CURRENCY}` },
                          { label: 'الربح', value: `${results.profit} ${CURRENCY}` },
                        ].map((item, i) => (<div key={i} className="flex justify-between py-1"><span className="text-gray-600 text-sm">{item.label}</span><span className="font-medium text-sm">{item.value}</span></div>))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div><h3 className="text-xl font-bold">السعر النهائي للمشروع</h3><p className="text-blue-100 text-sm">شامل جميع التكاليف والربح</p></div>
                    <div className="text-right"><p className="text-4xl font-bold">{results.finalPrice} {CURRENCY}</p><p className="text-blue-100 text-sm">شامل ضريبة القيمة المضافة</p></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={handleExportPdf} className="flex items-center px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-sm text-sm font-medium"><FaFilePdf className="mr-2" /> تصدير PDF</button>
                  <button onClick={() => toast.success('جاري إنشاء تقرير Excel...')} className="flex items-center px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm text-sm font-medium"><FaFileExcel className="mr-2" /> تصدير Excel</button>
                  <button onClick={copyResults} className="flex items-center px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all shadow-sm text-sm font-medium"><FaCopy className="mr-2" /> نسخ النتائج</button>
                  <button onClick={() => toast.info('جارٍ التصدير...')} className="flex items-center px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all shadow-sm text-sm font-medium"><FaDownload className="mr-2" /> تحميل</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CostCalculatorPage;
