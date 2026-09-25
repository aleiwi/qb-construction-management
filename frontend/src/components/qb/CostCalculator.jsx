import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaCalculator, FaSave, FaFilePdf, FaFileExcel, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from "jspdf";
import "jspdf-autotable";
// import { authAPI } from '../../utils/qb/utils/api'; // Not needed for now
import Swal from 'sweetalert2';
import { projectsDB } from '../lib/database';
import { DatabaseService } from '../lib/database';

const CostCalculator = () => {
  const navigate = useNavigate();
  
  // استخراج المعلمات من URL
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'new';
  const projectId = urlParams.get('projectId');
  
  // حالة البيانات الرئيسية
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
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

  // حالة بنود المشروع
  const [items, setItems] = useState([
    {
      id: 1,
      type: 'foundation',
      name: '',
      length: '',
      width: '',
      thickness: '',
      concreteQty: 0,
      steelQty: 0,
      blockQty: 0,
      totalCost: 0
    }
  ]);

  // حالة النتائج
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // تحديث البيانات عند تحميل الصفحة
  useEffect(() => {
    const loadProjectData = async () => {
      if (mode === 'edit' && projectId) {
        try {
          const project = await projectsDB.getById(projectId);
          if (project) {
            setProjectData({
              name: project.name || '',
              description: project.description || '',
              location: project.location || '',
              startDate: project.start_date || '',
              endDate: project.delivery_date || '',
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
            console.log('تم تحميل بيانات المشروع:', project);
          }
        } catch (error) {
          console.error('Error loading project data:', error);
          toast.error('خطأ في تحميل بيانات المشروع');
        }
      }
    };
    
    loadProjectData();
  }, [mode, projectId]);

  // حساب الكميات والتكاليف
  const calculateItem = (item) => {
    const length = parseFloat(item.length) || 0;
    const width = parseFloat(item.width) || 0;
    const thickness = parseFloat(item.thickness) || 0;
    
    const concretePrice = parseFloat(projectData.concretePrice) || 0;
    const steelPrice = parseFloat(projectData.steelPrice) || 0;
    const blockPrice = parseFloat(projectData.blockPrice) || 0;

    // حساب المساحة أو الحجم
    const area = length * width;
    const volume = area * thickness;

    // حساب الكميات حسب نوع البند
    let concreteQty = 0;
    let steelQty = 0;
    let blockQty = 0;

    switch(item.type) {
      case 'foundation':
        concreteQty = volume;
        steelQty = volume * 100; // 100 كجم/م³ للأساسات
        break;
      case 'slab':
        concreteQty = volume;
        steelQty = volume * 80; // 80 كجم/م³ للأسقف
        break;
      case 'column':
        concreteQty = volume;
        steelQty = volume * 150; // 150 كجم/م³ للأعمدة
        break;
      case 'wall':
        blockQty = area * 12.5; // 12.5 بلوك/م² للجدران
        concreteQty = area * 0.05; // 0.05 م³/م² للجدران
        break;
      case 'tank':
        concreteQty = volume;
        steelQty = volume * 120; // 120 كجم/م³ للخزانات
        break;
      default:
        concreteQty = volume;
        steelQty = volume * 100;
    }

    // حساب التكاليف
    const concreteCost = concreteQty * concretePrice;
    const steelCost = steelQty * steelPrice;
    const blockCost = blockQty * blockPrice;
    const totalCost = concreteCost + steelCost + blockCost;

    return {
      ...item,
      concreteQty: concreteQty.toFixed(2),
      steelQty: steelQty.toFixed(2),
      blockQty: blockQty.toFixed(2),
      totalCost: totalCost.toFixed(2)
    };
  };

  const calculateAll = () => {
    const updatedItems = items.map(item => calculateItem(item));
    setItems(updatedItems);
    
    // حساب النتائج الإجمالية
    const totals = updatedItems.reduce((acc, item) => {
      acc.concreteQty += parseFloat(item.concreteQty) || 0;
      acc.steelQty += parseFloat(item.steelQty) || 0;
      acc.blockQty += parseFloat(item.blockQty) || 0;
      acc.totalCost += parseFloat(item.totalCost) || 0;
      return acc;
    }, {
      concreteQty: 0,
      steelQty: 0,
      blockQty: 0,
      totalCost: 0
    });

    // حساب المخرجات المفصلة
    const contractorCost = totals.totalCost * 0.3; // 30% مقاول
    const overhead = totals.totalCost * 0.15; // 15% مصاريف إدارية
    const concreteInsulation = totals.concreteQty * 50; // 50 ريال/م³ عزل خرسانة
    const areaInsulation = (totals.concreteQty / 0.3) * 25; // 25 ريال/م² عزل مساحي
    const profit = totals.totalCost * (parseFloat(projectData.profitRate) / 100);

    setResults({
      ...totals,
      contractorCost: contractorCost.toFixed(2),
      overhead: overhead.toFixed(2),
      concreteInsulation: concreteInsulation.toFixed(2),
      areaInsulation: areaInsulation.toFixed(2),
      profit: profit.toFixed(2),
      finalPrice: (totals.totalCost + contractorCost + overhead + concreteInsulation + areaInsulation + profit).toFixed(2)
    });

    toast.success('تم حساب التكاليف بنجاح');
  };

  const addItem = (type) => {
    const newItem = {
      id: Date.now(),
      type: type,
      name: '',
      length: '',
      width: '',
      thickness: '',
      concreteQty: 0,
      steelQty: 0,
      blockQty: 0,
      totalCost: 0
    };
    setItems([...items, newItem]);
  };

  const getItemName = (type) => {
    const names = {
      foundation: 'بند أساسات',
      slab: 'بند سقف',
      column: 'بند عمود',
      wall: 'بند جدار',
      tank: 'بند خزان'
    };
    return names[type] || 'بند جديد';
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const generatePdf = () => {
    if (!results) {
      toast.error('يرجى حساب التكاليف أولاً');
      return;
    }

    const doc = new jsPDF();

    // Add project name and description
    doc.text(`Project: ${projectData.name}`, 14, 20);
    doc.text(`Description: ${projectData.description}`, 14, 30);

    // Items table
    const itemColumns = ["Item", "Length (m)", "Width (m)", "Thickness (m)", "Concrete (m³)", "Steel (kg)", "Blocks", "Cost (SAR)"];
    const itemRows = items.map(item => [
      item.name,
      item.length,
      item.width,
      item.thickness,
      item.concreteQty,
      item.steelQty,
      item.blockQty,
      item.totalCost
    ]);

    doc.autoTable({
      startY: 40,
      head: [itemColumns],
      body: itemRows,
    });

    // Results table
    const resultsY = doc.autoTable.previous.finalY + 10;
    const resultsColumns = ["Category", "Value"];
    const resultsRows = [
      ["Total Concrete (m³)", results.concreteQty],
      ["Total Steel (kg)", results.steelQty],
      ["Total Blocks", results.blockQty],
      ["Total Material Cost (SAR)", results.totalCost],
      ["Contractor Cost (SAR)", results.contractorCost],
      ["Overhead (SAR)", results.overhead],
      ["Concrete Insulation (SAR)", results.concreteInsulation],
      ["Area Insulation (SAR)", results.areaInsulation],
      ["Profit (SAR)", results.profit],
      ["Final Price (SAR)", results.finalPrice],
    ];

    doc.autoTable({
      startY: resultsY,
      head: [resultsColumns],
      body: resultsRows,
    });

    doc.save(`${projectData.name || 'cost-calculator'}_report.pdf`);
  };

  const saveProject = async () => {
    console.log('🚀 تم النقر على زر حفظ المشروع');
    
    if (!results) {
      console.log('❌ لا توجد نتائج للحساب');
      toast.error('يرجى حساب التكاليف أولاً');
      return;
    }

    console.log('📊 بيانات المشروع:', { name: projectData.name, results });

    if (!projectData.name) {
      console.log('❌ لا يوجد اسم مشروع');
      toast.error('يرجى إدخال اسم المشروع');
      return;
    }

    if (!projectData.location) {
      console.log('❌ لا يوجد موقع مشروع');
      toast.error('يرجى إدخال موقع المشروع');
      return;
    }

    if (!projectData.projectType) {
      console.log('❌ لم يتم اختيار نوع المشروع');
      toast.error('يرجى اختيار نوع المشروع');
      return;
    }

    if (!projectData.area) {
      console.log('❌ لم يتم إدخال المساحة');
      toast.error('يرجى إدخال مساحة المشروع');
      return;
    }

    if (!projectData.floors) {
      console.log('❌ لم يتم إدخال عدد الطوابق');
      toast.error('يرجى إدخال عدد طوابق المشروع');
      return;
    }

    if (!projectData.concretePrice) {
      console.log('❌ لم يتم إدخال سعر الخرسانة');
      toast.error('يرجى إدخال سعر الخرسانة');
      return;
    }

    if (!projectData.steelPrice) {
      console.log('❌ لم يتم إدخال سعر الحديد');
      toast.error('يرجى إدخال سعر الحديد');
      return;
    }

    if (!projectData.profitRate) {
      console.log('❌ لم يتم إدخال نسبة الربح');
      toast.error('يرجى إدخال نسبة الربح');
      return;
    }

    // فحص المصادقة (مبسّط للنموذج الأولي)
    console.log('🔐 المتابعة مع قاعدة البيانات...');

    try {
      setLoading(true);
      
      console.log('🚀 بدء حفظ المشروع...', {
        projectName: projectData.name,
        itemsCount: items.length,
        totalCost: results.finalPrice
      });
      
      // إنشاء المشروع باستخدام DatabaseService
      const projectToSave = {
        name: projectData.name,
        description: projectData.description,
        location: projectData.location,
        project_type: projectData.projectType,
        start_date: projectData.startDate || null,
        delivery_date: projectData.endDate || null,
        area: parseFloat(projectData.area) || null,
        floors: parseInt(projectData.floors) || null,
        budget: parseFloat(results.finalPrice) || null,
        status: 'قيد التنفيذ',
        completion_percentage: 0,
        concrete_price: parseFloat(projectData.concretePrice) || null,
        steel_price: parseFloat(projectData.steelPrice) || null,
        block_price: parseFloat(projectData.blockPrice) || null,
        plaster_price: parseFloat(projectData.plasterPrice) || null,
        labor_rate: parseFloat(projectData.laborRate) || null,
        equipment_rate: parseFloat(projectData.equipmentRate) || null,
        profit_rate: parseFloat(projectData.profitRate) || null
      };
      
      console.log('📋 بيانات المشروع للحفظ:', projectToSave);
      const savedProject = await DatabaseService.createProject(projectToSave);
      
      console.log('✅ تم حفظ المشروع بنجاح:', savedProject);
      
      console.log('✅ تم حفظ المشروع بنجاح:', savedProject);
      
      toast.success(`تم حفظ المشروع "${projectData.name}" بنجاح!`);
      
      // عرض سؤال للمستخدم
      const result = await Swal.fire({
        title: 'تم حفظ المشروع بنجاح! 🎉',
        text: `تم حفظ مشروع "${projectData.name}" وجميع بيانات الحاسبة. هل تريد الانتقال للوحة التحكم لعرض المشروع الجديد؟`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'نعم، عرض لوحة التحكم',
        cancelButtonText: 'البقاء في الحاسبة',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        customClass: {
          title: 'font-bold text-lg',
          text: 'text-base',
          confirmButton: 'px-6 py-3',
          cancelButton: 'px-6 py-3'
        }
      });

      if (result.isConfirmed) {
        // الانتقال للوحة التحكم
        navigate('/dashboard');
        toast.info('انتقل للوحة التحكم');
      } else {
        // إعادة تعيين النموذج
        setProjectData({
          name: '',
          description: '',
          location: '',
          startDate: '',
          endDate: '',
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
        setItems([
          {
            id: 1,
            type: 'foundation',
            name: '',
            length: '',
            width: '',
            thickness: '',
            concreteQty: 0,
            steelQty: 0,
            blockQty: 0,
            totalCost: 0
          }
        ]);
        setResults(null);
      }
    } catch (error) {
      console.error('❌ خطأ في حفظ المشروع:', error);
      
      // عرض رسالة خطأ مفصلة
      let errorMessage = 'حدث خطأ في حفظ المشروع';
      
      if (error.message && error.message.includes('relation "project_calculations" does not exist')) {
        errorMessage = 'ح قاعدة البيانات لم يتم إعدادها بعد. يرجى تشغيل SQL في Backend';
      } else if (error.message && (error.message.includes('authentication') || error.message.includes('تسجيل الدخول'))) {
        errorMessage = 'يجب تسجيل الدخول أولاً قبل حفظ المشروع. يرجى تسجيل الدخول أو إنشاء حساب جديد.';
      } else if (error.message && error.message.includes('network')) {
        errorMessage = 'خطأ في الاتصال بقاعدة البيانات. يرجى التحقق من اتصال الإنترنت';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'خطأ في الحفظ',
        html: `
          <p>${errorMessage}</p>
          <p class="text-sm text-gray-600 mt-2">تفاصيل الخطأ: ${error.message || 'خطأ غير معروف'}</p>
        `,
        confirmButtonText: 'حسناً'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <FaCalculator className="ml-3 text-blue-600" />
              الحاسبة الاحترافية للمشاريع الإنشائية
              {mode === 'edit' && <span className="text-lg text-orange-600 ml-4">(وضع التعديل)</span>}
              {mode === 'new' && <span className="text-lg text-green-600 ml-4">(مشروع جديد)</span>}
            </h1>
            <p className="text-gray-600">حساب تفصيلي لكميات وتكاليف مواد البناء حسب المواصفات الهندسية</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* إعدادات المشروع */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">إعدادات المشروع</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشروع</label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData({...projectData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم المشروع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">موقع المشروع</label>
                <input
                  type="text"
                  value={projectData.location}
                  onChange={(e) => setProjectData({...projectData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="موقع المشروع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData({...projectData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="وصف المشروع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المساحة (م²)</label>
                <input
                  type="number"
                  value={projectData.area}
                  onChange={(e) => setProjectData({...projectData, area: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="المساحة بالمتر المربع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عدد الطوابق</label>
                <input
                  type="number"
                  value={projectData.floors}
                  onChange={(e) => setProjectData({...projectData, floors: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="عدد الطوابق"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البداية</label>
                <input
                  type="date"
                  value={projectData.startDate}
                  onChange={(e) => setProjectData({...projectData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التسليم</label>
                <input
                  type="date"
                  value={projectData.endDate}
                  onChange={(e) => setProjectData({...projectData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع المشروع</label>
                <select
                  value={projectData.projectType}
                  onChange={(e) => setProjectData({...projectData, projectType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر نوع المشروع</option>
                  <option value="تجاري">تجاري</option>
                  <option value="سكني">سكني</option>
                  <option value="تعليمي">تعليمي</option>
                  <option value="طبي">طبي</option>
                  <option value="سياحي">سياحي</option>
                  <option value="صناعي">صناعي</option>
                  <option value="عام">عام</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سعر الخرسانة (ريال/م³)</label>
                <input
                  type="number"
                  value={projectData.concretePrice}
                  onChange={(e) => setProjectData({...projectData, concretePrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="سعر المتر المكعب"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سعر الحديد (ريال/كجم)</label>
                <input
                  type="number"
                  value={projectData.steelPrice}
                  onChange={(e) => setProjectData({...projectData, steelPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="سعر الكيلوجرام"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سعر البلوك (ريال/قطعة)</label>
                <input
                  type="number"
                  value={projectData.blockPrice}
                  onChange={(e) => setProjectData({...projectData, blockPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="سعر القطعة الواحدة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الربح (%)</label>
                <input
                  type="number"
                  value={projectData.profitRate}
                  onChange={(e) => setProjectData({...projectData, profitRate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="نسبة الربح المطلوبة"
                />
              </div>

              <button
                onClick={calculateAll}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
              >
                احسب التكاليف
              </button>
            </div>
          </div>
        </div>

        {/* جدول البنود */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">بنود المشروع</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => addItem('foundation')}
                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    أساسات
                  </button>
                  <button
                    onClick={() => addItem('slab')}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    أسقف
                  </button>
                  <button
                    onClick={() => addItem('column')}
                    className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                  >
                    أعمدة
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">البند</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطول (م)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العرض (م)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">السماكة (م)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">خرسانة (م³)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">حديد (كجم)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">بلوك (قطعة)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التكلفة (ريال)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <input
                          type="number"
                          value={item.length}
                          onChange={(e) => updateItem(item.id, 'length', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <input
                          type="number"
                          value={item.width}
                          onChange={(e) => updateItem(item.id, 'width', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <input
                          type="number"
                          value={item.thickness}
                          onChange={(e) => updateItem(item.id, 'thickness', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.concreteQty}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.steelQty}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.blockQty}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.totalCost}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* النتائج */}
      {results && (
        <div className="mt-8 space-y-6">
          {/* الكميات الإجمالية */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">الكميات الإجمالية</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-600">الخرسانة</p>
                <p className="text-xl font-bold text-blue-900">{results.concreteQty} م³</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-green-600">الحديد</p>
                <p className="text-xl font-bold text-green-900">{results.steelQty} كجم</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-sm text-yellow-600">البلوك</p>
                <p className="text-xl font-bold text-yellow-900">{results.blockQty} قطعة</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-purple-600">الإجمالي</p>
                <p className="text-xl font-bold text-purple-900">{results.totalCost} ريال</p>
              </div>
            </div>
          </div>

          {/* التكاليف التفصيلية */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">التكاليف التفصيلية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">تكاليف مباشرة</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">تكلفة المواد:</span>
                    <span className="font-medium">{results.totalCost} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">مقاول المصنعيات:</span>
                    <span className="font-medium">{results.contractorCost} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المصاريف الإدارية:</span>
                    <span className="font-medium">{results.overhead} ريال</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-3">تكاليف إضافية</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">عزل الخرسانة:</span>
                    <span className="font-medium">{results.concreteInsulation} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">عزل المساحات:</span>
                    <span className="font-medium">{results.areaInsulation} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الربح:</span>
                    <span className="font-medium">{results.profit} ريال</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* السعر النهائي */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">السعر النهائي للمشروع</h3>
                <p className="text-blue-100">شامل جميع التكاليف والربح</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{results.finalPrice} ريال</p>
                <p className="text-blue-100">شامل ضريبة القيمة المضافة</p>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveProject}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <FaSave className="ml-2" />
              {loading ? 'جاري الحفظ...' : 'حفظ المشروع'}
            </button>
            <button
              onClick={generatePdf}
              disabled={!results}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <FaFilePdf className="ml-2" />
              تقرير PDF
            </button>
            <button
              onClick={() => toast.success('جاري إنشاء تقرير Excel...')}
              disabled={!results}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <FaFileExcel className="ml-2" />
              تقرير Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCalculator;