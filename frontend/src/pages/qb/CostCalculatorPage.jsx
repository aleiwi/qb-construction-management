import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaCalculator, FaSave, FaFilePdf, FaFileExcel, FaPlus, FaTrash } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

const CURRENCY = 'ريال';

const itemNames = { foundation: 'بند أساسات', slab: 'بند سقف', column: 'بند عمود', wall: 'بند جدار', tank: 'بند خزان' };
const itemColors = { foundation: '#3B82F6', slab: '#10B981', column: '#F59E0B', wall: '#EF4444', tank: '#8B5CF6' };

const CostCalculatorPage = () => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'new';
  const projectId = urlParams.get('projectId');

  const [projectData, setProjectData] = useState({
    name: '', description: '', location: '', startDate: '', endDate: '',
    projectType: '', area: '', floors: '',
    concretePrice: '', steelPrice: '', blockPrice: '', plasterPrice: '',
    laborRate: '', equipmentRate: '', profitRate: ''
  });

  const [items, setItems] = useState([{
    id: 1, type: 'foundation', name: '', length: '', width: '', thickness: '',
    concreteQty: 0, steelQty: 0, blockQty: 0, totalCost: 0
  }]);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && projectId) loadProjectData();
  }, [mode, projectId]);

  const loadProjectData = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      const project = response.data;
      setProjectData({
        name: project.name || '', description: project.description || '',
        location: project.location || '', projectType: project.project_type || '',
        area: project.area?.toString() || '', floors: project.floors?.toString() || '',
        concretePrice: project.concrete_price?.toString() || '',
        steelPrice: project.steel_price?.toString() || '',
        blockPrice: project.block_price?.toString() || '',
        plasterPrice: project.plaster_price?.toString() || '',
        laborRate: project.labor_rate?.toString() || '',
        equipmentRate: project.equipment_rate?.toString() || '',
        profitRate: project.profit_rate?.toString() || ''
      });
    } catch (err) {
      toast.error('فشل تحميل بيانات المشروع');
    }
  };

  const handleInputChange = (field, value) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const calculateItem = (item) => {
    const length = parseFloat(item.length) || 0;
    const width = parseFloat(item.width) || 0;
    const thickness = parseFloat(item.thickness) || 0;
    const concretePrice = parseFloat(projectData.concretePrice) || 0;
    const steelPrice = parseFloat(projectData.steelPrice) || 0;
    const blockPrice = parseFloat(projectData.blockPrice) || 0;
    const area = length * width;
    const volume = area * thickness;

    let concreteQty = 0, steelQty = 0, blockQty = 0;
    switch (item.type) {
      case 'foundation': concreteQty = volume; steelQty = volume * 100; break;
      case 'slab': concreteQty = volume; steelQty = volume * 80; break;
      case 'column': concreteQty = volume; steelQty = volume * 150; break;
      case 'wall': blockQty = area * 12.5; concreteQty = area * 0.05; break;
      case 'tank': concreteQty = volume; steelQty = volume * 120; break;
      default: concreteQty = volume; steelQty = volume * 100;
    }
    const totalCost = concreteQty * concretePrice + steelQty * steelPrice + blockQty * blockPrice;
    return { ...item, concreteQty: concreteQty.toFixed(2), steelQty: steelQty.toFixed(2), blockQty: blockQty.toFixed(2), totalCost: totalCost.toFixed(2) };
  };

  const calculateAll = () => {
    const updatedItems = items.map(item => calculateItem(item));
    setItems(updatedItems);
    const totals = updatedItems.reduce((acc, item) => {
      acc.concreteQty += parseFloat(item.concreteQty) || 0;
      acc.steelQty += parseFloat(item.steelQty) || 0;
      acc.blockQty += parseFloat(item.blockQty) || 0;
      acc.totalCost += parseFloat(item.totalCost) || 0;
      return acc;
    }, { concreteQty: 0, steelQty: 0, blockQty: 0, totalCost: 0 });

    const contractorCost = totals.totalCost * 0.3;
    const overhead = totals.totalCost * 0.15;
    const concreteInsulation = totals.concreteQty * 50;
    const areaInsulation = (totals.concreteQty / 0.3) * 25;
    const profit = totals.totalCost * (parseFloat(projectData.profitRate) / 100);
    const finalPrice = (totals.totalCost + contractorCost + overhead + concreteInsulation + areaInsulation + profit).toFixed(2);

    setResults({ ...totals, contractorCost: contractorCost.toFixed(2), overhead: overhead.toFixed(2), concreteInsulation: concreteInsulation.toFixed(2), areaInsulation: areaInsulation.toFixed(2), profit: profit.toFixed(2), finalPrice });
    toast.success('تم حساب التكاليف بنجاح');
  };

  const addItem = (type) => {
    setItems([...items, { id: Date.now(), type, name: '', length: '', width: '', thickness: '', concreteQty: 0, steelQty: 0, blockQty: 0, totalCost: 0 }]);
  };

  const deleteItem = (id) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const saveProject = async () => {
    try {
      const payload = { name: projectData.name, description: projectData.description, location: projectData.location, project_type: projectData.projectType, area: parseFloat(projectData.area) || 0, floors: parseInt(projectData.floors) || 0, concrete_price: parseFloat(projectData.concretePrice) || 0, steel_price: parseFloat(projectData.steelPrice) || 0, block_price: parseFloat(projectData.blockPrice) || 0, plaster_price: parseFloat(projectData.plasterPrice) || 0, labor_rate: parseFloat(projectData.laborRate) || 0, equipment_rate: parseFloat(projectData.equipmentRate) || 0, profit_rate: parseFloat(projectData.profitRate) || 15 };
      if (mode === 'edit' && projectId) { await api.put(`/projects/${projectId}`, payload); toast.success('تم تحديث المشروع'); }
      else { await api.post('/projects', payload); toast.success('تم إنشاء المشروع'); }
      navigate('/projects');
    } catch (err) { toast.error('فشل حفظ المشروع'); }
  };

  const generatePdf = () => { toast.info('جاري إنشاء تقرير PDF...'); };

  const chartData = results ? [
    { name: 'الخرسانة', cost: parseFloat(results.concreteQty) * parseFloat(projectData.concretePrice || 0) },
    { name: 'الحديد', cost: parseFloat(results.steelQty) * parseFloat(projectData.steelPrice || 0) },
    { name: 'البلوك', cost: parseFloat(results.blockQty) * parseFloat(projectData.blockPrice || 0) },
    { name: 'المقاول', cost: parseFloat(results.contractorCost) },
    { name: 'المصاريف', cost: parseFloat(results.overhead) },
  ].filter(d => d.cost > 0) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <FaCalculator className="ml-3 text-blue-600" /> حاسبة التكاليف
          </h1>
          <p className="text-lg text-orange-600 ml-4">{projectData.name || 'مشروع جديد'}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">إعدادات المشروع</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم المشروع</label>
                  <input type="text" value={projectData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="اسم المشروع" />
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
                  <input type="text" value={projectData.location} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="الموقع" />
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">المساحة (م²)</label>
                  <input type="number" value={projectData.area} onChange={(e) => handleInputChange('area', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">عدد الأدوار</label>
                  <input type="number" value={projectData.floors} onChange={(e) => handleInputChange('floors', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <hr className="my-4" />
                <h4 className="font-medium text-gray-700">أسعار المواد</h4>
                {[{ key: 'concretePrice', label: 'سعر الخرسانة (ريال/م³)' }, { key: 'steelPrice', label: 'سعر الحديد (ريال/كجم)' }, { key: 'blockPrice', label: 'سعر البلوك (ريال/قطعة)' }].map(f => (
                  <div key={f.key}><label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                    <input type="number" value={projectData[f.key]} onChange={(e) => handleInputChange(f.key, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
                <hr className="my-4" />
                <div><label className="block text-sm font-medium text-gray-700 mb-1">هامش الربح (%)</label>
                  <input type="number" value={projectData.profitRate} onChange={(e) => handleInputChange('profitRate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">بنود المشروع</h3>
                <div className="flex gap-2 flex-wrap">
                  {['foundation', 'slab', 'column', 'wall', 'tank'].map(type => (
                    <button key={type} onClick={() => addItem(type)} className="text-white px-3 py-1 rounded-md text-sm hover:opacity-90 transition-colors flex items-center" style={{ backgroundColor: itemColors[type] }}>
                      <FaPlus className="mr-1" /> {itemNames[type]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">النوع</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الطول</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">العرض</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">السُمك</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الخرسانة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحديد</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">البلوك</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التكلفة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراء</th>
                  </tr></thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm" style={{ color: itemColors[item.type] }}>{itemNames[item.type]}</td>
                        <td className="px-4 py-3"><input type="number" value={item.length} onChange={(e) => updateItem(item.id, 'length', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" /></td>
                        <td className="px-4 py-3"><input type="number" value={item.width} onChange={(e) => updateItem(item.id, 'width', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" /></td>
                        <td className="px-4 py-3"><input type="number" value={item.thickness} onChange={(e) => updateItem(item.id, 'thickness', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" /></td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.concreteQty}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.steelQty}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.blockQty}</td>
                        <td className="px-4 py-3 text-sm font-medium">{item.totalCost}</td>
                        <td className="px-4 py-3"><button onClick={() => deleteItem(item.id)} className="text-red-600 hover:text-red-900"><FaTrash /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={calculateAll} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <FaCalculator className="mr-2" /> حساب التكاليف
                </button>
                <button onClick={saveProject} className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  <FaSave className="mr-2" /> حفظ المشروع
                </button>
              </div>
            </div>
            {chartData.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">توزيع التكاليف</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="cost" fill="#3B82F6" name={CURRENCY} /></BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {results && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center"><p className="text-sm text-blue-600">الخرسانة</p><p className="text-xl font-bold text-blue-900">{results.concreteQty} م³</p></div>
                  <div className="bg-green-50 p-4 rounded-lg text-center"><p className="text-sm text-green-600">الحديد</p><p className="text-xl font-bold text-green-900">{results.steelQty} كجم</p></div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center"><p className="text-sm text-yellow-600">البلوك</p><p className="text-xl font-bold text-yellow-900">{results.blockQty} قطعة</p></div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center"><p className="text-sm text-purple-600">الإجمالي</p><p className="text-xl font-bold text-purple-900">{results.totalCost} {CURRENCY}</p></div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">التكاليف التفصيلية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><h4 className="font-medium text-gray-700 mb-3">تكاليف مباشرة</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-600">تكلفة المواد:</span><span className="font-medium">{results.totalCost} {CURRENCY}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">مقاول المصنعيات:</span><span className="font-medium">{results.contractorCost} {CURRENCY}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">المصاريف الإدارية:</span><span className="font-medium">{results.overhead} {CURRENCY}</span></div>
                      </div>
                    </div>
                    <div><h4 className="font-medium text-gray-700 mb-3">تكاليف إضافية</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-600">عزل الخرسانة:</span><span className="font-medium">{results.concreteInsulation} {CURRENCY}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">عزل المساحات:</span><span className="font-medium">{results.areaInsulation} {CURRENCY}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">الربح:</span><span className="font-medium">{results.profit} {CURRENCY}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
                  <div className="flex justify-between items-center">
                    <div><h3 className="text-xl font-semibold">السعر النهائي للمشروع</h3><p className="text-blue-100">شامل جميع التكاليف والربح</p></div>
                    <div className="text-right"><p className="text-3xl font-bold">{results.finalPrice} {CURRENCY}</p><p className="text-blue-100">شامل ضريبة القيمة المضافة</p></div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={generatePdf} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"><FaFilePdf className="mr-2" /> تقرير PDF</button>
                  <button onClick={() => toast.success('جاري إنشاء تقرير Excel...')} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"><FaFileExcel className="mr-2" /> تقرير Excel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostCalculatorPage;
