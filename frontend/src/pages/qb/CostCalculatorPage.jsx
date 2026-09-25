import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaCalculator, FaSave, FaFilePdf, FaFileExcel, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../../api/axios';

const CostCalculatorPage = () => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'new';
  const projectId = urlParams.get('projectId');

  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    location: '',
    projectType: '',
    area: '',
    floors: '',
    concretePrice: '',
    steelPrice: '',
    blockPrice: '',
    plasterPrice: '',
    laborRate: '',
    equipmentRate: '',
    profitRate: ''
  });

  const [items, setItems] = useState([
    { id: 1, type: 'foundation', name: '', quantity: 0, unit: 'م³', unitPrice: 0, totalCost: 0 }
  ]);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load project data for edit mode
  useEffect(() => {
    if (mode === 'edit' && projectId) {
      loadProjectData();
    }
  }, [mode, projectId]);

  const loadProjectData = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      const project = response.data;
      setProjectData({
        name: project.name || '',
        description: project.description || '',
        location: project.location || '',
        projectType: project.project_type || '',
        area: project.area?.toString() || '',
        floors: project.floors?.toString() || '',
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

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: Date.now(), type: 'general', name: '', quantity: 0, unit: 'م³', unitPrice: 0, totalCost: 0
    }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const calculateCost = () => {
    let totalMaterials = 0;
    let totalLabor = 0;
    let totalEquipment = 0;

    const updatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const total = qty * price;
      return { ...item, totalCost: total };
    });

    setItems(updatedItems);
    totalMaterials = updatedItems.reduce((sum, item) => sum + item.totalCost, 0);
    totalLabor = totalMaterials * (parseFloat(projectData.laborRate || 0) / 100);
    totalEquipment = totalMaterials * (parseFloat(projectData.equipmentRate || 0) / 100);

    const profitMargin = parseFloat(projectData.profitRate || 15);
    const subtotal = totalMaterials + totalLabor + totalEquipment;
    const profit = subtotal * (profitMargin / 100);
    const vat = subtotal * 0.15; // 15% VAT
    const total = subtotal + profit + vat;

    setResults({
      totalMaterials,
      totalLabor,
      totalEquipment,
      subtotal,
      profitMargin,
      profit,
      vat,
      total,
      items: updatedItems
    });
  };

  const saveProject = async () => {
    try {
      const payload = {
        name: projectData.name,
        description: projectData.description,
        location: projectData.location,
        project_type: projectData.projectType,
        area: parseFloat(projectData.area) || 0,
        floors: parseInt(projectData.floors) || 0,
        concrete_price: parseFloat(projectData.concretePrice) || 0,
        steel_price: parseFloat(projectData.steelPrice) || 0,
        block_price: parseFloat(projectData.blockPrice) || 0,
        plaster_price: parseFloat(projectData.plasterPrice) || 0,
        labor_rate: parseFloat(projectData.laborRate) || 0,
        equipment_rate: parseFloat(projectData.equipmentRate) || 0,
        profit_rate: parseFloat(projectData.profitRate) || 15,
      };

      if (mode === 'edit' && projectId) {
        await api.put(`/projects/${projectId}`, payload);
        toast.success('تم تحديث المشروع بنجاح');
      } else {
        await api.post('/projects', payload);
        toast.success('تم إنشاء المشروع بنجاح');
      }
      navigate('/projects');
    } catch (err) {
      toast.error('فشل حفظ المشروع');
    }
  };

  const exportPDF = () => {
    if (!results) return;
    toast.info('جاري تصدير PDF...');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FaCalculator className="text-blue-400" />
            حاسبة التكاليف
          </h1>
          <div className="flex gap-3">
            <button onClick={calculateCost} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <FaCalculator /> حساب التكاليف
            </button>
            <button onClick={saveProject} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <FaSave /> حفظ المشروع
            </button>
          </div>
        </div>

        {/* Project Data Form */}
        <div className="bg-slate-900 rounded-xl p-6 mb-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">بيانات المشروع</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['name', 'description', 'location'].map(field => (
              <div key={field}>
                <label className="text-sm text-slate-400 mb-1 block">{field === 'name' ? 'اسم المشروع' : field === 'description' ? 'الوصف' : 'الموقع'}</label>
                <input
                  type="text"
                  value={projectData[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder={field === 'name' ? 'أدخل اسم المشروع' : field === 'description' ? 'أدخل الوصف' : 'أدخل الموقع'}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
            {[
              { key: 'area', label: 'المساحة (م²)', type: 'number' },
              { key: 'floors', label: 'عدد الأدوار', type: 'number' },
              { key: 'concretePrice', label: 'سعر الخرسانة', type: 'number' },
              { key: 'steelPrice', label: 'سعر الحديد', type: 'number' },
              { key: 'blockPrice', label: 'سعر الكتل', type: 'number' },
              { key: 'plasterPrice', label: 'سعر الجص', type: 'number' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-sm text-slate-400 mb-1 block">{field.label}</label>
                <input
                  type="number"
                  value={projectData[field.key]}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {[
              { key: 'laborRate', label: 'معدل الأجور (%)' },
              { key: 'equipmentRate', label: 'معدل المعدات (%)' },
              { key: 'profitRate', label: 'هامش الربح (%)', default: 15 },
            ].map(field => (
              <div key={field.key}>
                <label className="text-sm text-slate-400 mb-1 block">{field.label}</label>
                <input
                  type="number"
                  value={projectData[field.key]}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-slate-900 rounded-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-400">بنود المشروع</h2>
            <button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm">
              <FaPlus /> إضافة بند
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-right p-3 text-slate-400">الاسم</th>
                  <th className="text-right p-3 text-slate-400">النوع</th>
                  <th className="text-right p-3 text-slate-400">الكمية</th>
                  <th className="text-right p-3 text-slate-400">الوحدة</th>
                  <th className="text-right p-3 text-slate-400">سعر الوحدة</th>
                  <th className="text-right p-3 text-slate-400">الإجمالي</th>
                  <th className="text-right p-3 text-slate-400">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-slate-800">
                    <td className="p-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="اسم البند"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={item.type}
                        onChange={(e) => handleItemChange(item.id, 'type', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="foundation">أساسات</option>
                        <option value="structure">هيكل</option>
                        <option value="finishing">تشطيب</option>
                        <option value="electrical">كهرباء</option>
                        <option value="plumbing">سباكة</option>
                        <option value="general">عام</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="م³">م³</option>
                        <option value="م²">م²</option>
                        <option value="قطعة">قطعة</option>
                        <option value="طن">طن</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-3 text-white font-semibold">
                      {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4 text-green-400">نتائج الحسابات</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'إجمالي المواد', value: results.totalMaterials.toLocaleString() },
                { label: 'إجمالي الأجور', value: results.totalLabor.toLocaleString() },
                { label: 'إجمالي المعدات', value: results.totalEquipment.toLocaleString() },
                { label: 'المجموع الفرعي', value: results.subtotal.toLocaleString() },
                { label: 'هامش الربح', value: `${results.profit.toLocaleString()} (${results.profitMargin}%)` },
                { label: 'ضريبة القيمة المضافة', value: results.vat.toLocaleString() },
                { label: 'الإجمالي النهائي', value: results.total.toLocaleString() },
              ].map((item, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-4 text-center">
                  <div className="text-slate-400 text-sm mb-1">{item.label}</div>
                  <div className="text-2xl font-bold text-white">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={exportPDF} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <FaFilePdf /> تصدير PDF
              </button>
              <button onClick={() => toast.info('جارٍ التصدير...')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <FaFileExcel /> تصدير Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostCalculatorPage;
