import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaCube,
  FaHardHat,
  FaClock,
  FaRocket,
  FaLayerGroup,
  FaCalendarAlt,
  FaArrowRight,
  FaPencilAlt,
  FaCogs,
  FaIndustry,
  FaTruck,
  FaCalculator,
  FaChartPie,
  FaPaintRoller,
  FaFlagCheckered
} from 'react-icons/fa';
import {
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';
import projectService from '../../services/qb/projectService.js';
import { Toaster, toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

// New Components
import TimelineComponent from '../../components/qb/TimelineComponent';
import TaskManager from '../../components/qb/TaskManager';


// --- Utility Functions ---
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(num) + ' ريال';
};

// دالة لتحويل نوع المشروع إلى العربية
const getProjectTypeArabic = (type) => {
  const types = {
    'construction': 'بناء',
    'تجاري': 'تجاري',
    'سكني': 'سكني',
    'تعليمي': 'تعليمي',
    'طبي': 'طبي',
    'سياحي': 'سياحي',
    'صناعي': 'صناعي',
    'عام': 'عام',
    'بناء سكني': 'بناء سكني',
    'بناء تجاري': 'بناء تجاري'
  };
  return types[type] || type || '-';
};

const formatDate = (dateString, styles = 'long') => {
  if (!dateString || dateString === 'undefined') return 'غير محدد';
  return new Date(dateString).toLocaleDateString('en-US', {
    dateStyle: styles
  });
};

/* --- Sub-Components --- */
const Card = ({ children, className = "", title, icon: Icon, action }) => (
  <div className={`bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
         <div className="flex items-center gap-3">
            {Icon && <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Icon size={16} /></div>}
            {title && <h3 className="font-bold text-gray-800 text-base">{title}</h3>}
         </div>
         {action}
      </div>
    )}
    <div className="flex-1">
      {children}
    </div>
  </div>
);

const DetailRow = ({ label, value, unit, isTotal }) => (
    <div className={`flex justify-between items-center py-2 ${isTotal ? 'bg-blue-50/50 p-2 rounded-lg mt-2' : 'border-b border-gray-50 last:border-0'}`}>
        <span className={`text-sm ${isTotal ? 'text-blue-800 font-bold' : 'text-gray-500'}`}>{label}</span>
        <span className={`text-sm ${isTotal ? 'text-blue-800 font-bold' : 'text-gray-800 font-medium'}`}>
            {value} {unit && <span className="text-xs text-gray-400 font-normal mr-1">{unit}</span>}
        </span>
    </div>
);

const PriceCard = ({ label, value, unit, icon: Icon, color = "blue" }) => {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        purple: "bg-purple-50 text-purple-600",
        rose: "bg-rose-50 text-rose-600",
    };

    // التحقق من القيمة وإصلاح NaN
    const numValue = parseFloat(value);
    const displayValue = isNaN(numValue) || numValue === 0 || !value ? '-' : numValue.toLocaleString('en-US');

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 hover:border-blue-200 transition-colors group">
            <div className={`p-2.5 rounded-xl ${colorClasses[color] || colorClasses.blue} group-hover:scale-110 transition-transform`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="font-bold text-gray-800 text-sm">
                    {displayValue} {displayValue !== '-' && <span className="text-[10px] font-normal text-gray-400">{unit}</span>}
                </p>
            </div>
        </div>
    );
};

const ProjectPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [calculatorData, setCalculatorData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (id) {
                try {
                    setLoading(true);
                    // Fetch basic project info AND calculator data
                    const [projData, calcData] = await Promise.all([
                        projectService.getProject(id),
                        projectService.getCalculatorData(id)
                    ]);
                    
                    console.log('📊 بيانات المشروع المحملة:', projData);
                    console.log('📊 بيانات الحاسبة المحملة (كاملة):', calcData);
                    console.log('📊 calculation_results:', calcData?.calculation_results);
                    console.log('📊 calculator_data:', calcData?.calculator_data);
                    console.log('📊 project_settings:', calcData?.project_settings);
                    
                    setProject(projData);
                    setCalculatorData(calcData);
                } catch (error) {
                    console.error("❌ فشل في تحميل بيانات المشروع:", error);
                    // عرض رسالة خطأ للمستخدم
                    toast.error('فشل في تحميل بيانات المشروع. يرجى المحاولة مرة أخرى.');
                } finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">جاري تحميل صفحة المشروع...</p>
            </div>
        );
    }

    if (!project) return <div className="text-center py-20">المشروع غير موجود</div>;

    // --- Data Extraction (Same as Modal) ---
    // البيانات تأتي من قاعدة البيانات بهذه البنية:
    // calculatorData.calculation_results = results
    // calculatorData.calculator_data.prices = prices
    // calculatorData.project_settings = projectData
    const results = calculatorData?.calculation_results || calculatorData?.results || {};
    const prices = calculatorData?.calculator_data?.prices || calculatorData?.prices || {}; 
    const projectData = calculatorData?.project_settings || calculatorData?.projectData || {};
    
    // دمج بيانات العزل والدفان من projectSettings إلى prices إذا لم تكن موجودة
    if (!prices.backfillPrice && projectData.backfillPrice) {
      prices.backfillPrice = projectData.backfillPrice;
    }
    if (!prices.insulationPrice && projectData.insulationPrice) {
      prices.insulationPrice = projectData.insulationPrice;
    }
    
    console.log('🔍 البيانات المستخرجة:', {
        results: Object.keys(results),
        prices: Object.keys(prices),
        projectData: Object.keys(projectData),
        backfillPrice: prices.backfillPrice || projectData.backfillPrice,
        insulationPrice: prices.insulationPrice || projectData.insulationPrice
    });
    
    // Metrics
    const finalPrice = parseFloat(results.finalPrice || project.estimated_cost || 0);
    const profitValue = parseFloat(results.profit || 0);
    const costWithoutProfit = finalPrice - profitValue;
    const materialsCost = parseFloat(results.concreteQty * (prices.concretePrice || 0) + 
                                     results.steelQty * (prices.steelPrice || 0) + 
                                     results.blockQty * (prices.blockPrice || 0)) || 
                                     parseFloat(results.totalCost || 0);
    const itemsTotal = parseFloat(results.totalCost || 0);

    const chartData = [
        { name: 'الخرسانة', value: parseFloat(results.concreteQty || 0), unit: 'م³', color: '#6366f1' },
        { name: 'الحديد', value: parseFloat(results.steelQty || 0), unit: 'طن', color: '#f43f5e' },
        { name: 'البلوك', value: parseFloat(results.blockQty || 0), unit: 'ألف', color: '#f59e0b' },
    ];

    // Timeline Data with Dynamic Dates
    const timelinePhases = [
        { id: 1, title: 'التخطيط والأساسات', icon: FaLayerGroup, color: 'bg-blue-500', date: formatDate(project.start_date || projectData.start_date, 'medium') },
        { id: 2, title: 'الهيكل العظمي', icon: FaHardHat, color: 'bg-orange-500', date: 'مرحلة التنفيذ' },
        { id: 3, title: 'التشطيبات', icon: FaPaintRoller, color: 'bg-purple-500', date: 'مرحلة التنفيذ' },
        { id: 4, title: 'التسليم', icon: FaFlagCheckered, color: 'bg-emerald-500', date: formatDate(project.delivery_date || projectData.delivery_date, 'medium') },
    ];

    // Calculate Timeline Phase
    const getPhaseFromStatus = (status) => {
        if (!status || status === 'تخطيط') return 1;
        if (status === 'قيد التنفيذ') return 2; 
        if (status === 'الهيكل العظمي') return 2;
        if (status === 'التشطيبات' || status === 'تشطيبات') return 3;
        if (status === 'معلق') return 2; 
        if (status === 'مكتمل') return 4;
        return 1;
    };
    const currentPhase = getPhaseFromStatus(project.status);

    const handlePhaseChange = async (phaseId) => {
        // 1. Check if already active
        if (currentPhase === phaseId) {
            return;
        }

        let newStatus = project.status;
        let phaseName = '';

        if (phaseId === 1) { newStatus = 'تخطيط'; phaseName = 'التخطيط والأساسات'; }
        if (phaseId === 2) { newStatus = 'الهيكل العظمي'; phaseName = 'الهيكل العظمي'; }
        if (phaseId === 3) { newStatus = 'تشطيبات'; phaseName = 'التشطيبات'; }
        if (phaseId === 4) { newStatus = 'مكتمل'; phaseName = 'تسليم المشروع'; }

        const result = await Swal.fire({
            title: `الانتقال إلى مرحلة: ${phaseName}؟`,
            text: "هل أنت متأكد من تغيير حالة المشروع؟",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'نعم، انتقل',
            cancelButtonText: 'إلغاء',
            customClass: {
                popup: 'rounded-2xl font-sans',
                title: 'font-bold text-lg',
                content: 'text-sm'
            }
        });

        if (result.isConfirmed) {
            try {
                // Optimistic UI Update
                setProject(prev => ({ ...prev, status: newStatus }));
                
                // API Call
                await projectService.updateProject(project.id, { status: newStatus });
                
                Swal.fire({
                    title: 'تم التحديث!',
                    text: `تم نقل المشروع إلى مرحلة ${phaseName} بنجاح.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' }
                });
            } catch (error) {
                console.error("Failed to update status", error);
                
                // Revert
                setProject(prev => ({ ...prev, status: project.status })); 
                
                Swal.fire({
                    title: 'خطأ',
                    text: 'فشل تحديث الحالة، يرجى المحاولة مرة أخرى.',
                    icon: 'error',
                    customClass: { popup: 'rounded-2xl' }
                });
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans" dir="rtl">
            <Toaster position="top-center" />
            
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                        >
                            <FaArrowRight />
                        </button>
                        <div>
                             <h1 className="text-xl font-bold text-gray-800">{project.name}</h1>
                             <span className="text-xs text-gray-500">عرض التفاصيل الكاملة</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <button 
                            onClick={() => navigate(`/project/${project.id}/edit`)}
                            className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm flex items-center gap-2"
                        >
                            <FaPencilAlt /> تعديل المشروع
                         </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* 🟥 SECTION 1: TIMELINE (Visual Progress) */}
                    <div className="bg-white rounded-[2rem] p-1 shadow-sm border border-gray-100">
                        <TimelineComponent 
                            currentPhase={currentPhase} 
                            phases={timelinePhases}
                            onPhaseChange={handlePhaseChange}
                        /> 
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* BLOCK A: Project Identity & Dates (Col-4) */}
                    <div className="md:col-span-4 space-y-6">
                        <Card title="بيانات المشروع" icon={FaCalendarAlt}>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-xs text-gray-400 mb-2">الوصف</p>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                        {project.description || 'لا يوجد وصف متاح للمشروع.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-blue-50/50 rounded-xl">
                                        <p className="text-[10px] text-blue-400 font-bold mb-1">تاريخ البدء</p>
                                        <p className="text-sm font-bold text-blue-900">{formatDate(project.start_date || projectData.start_date)}</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50/50 rounded-xl">
                                        <p className="text-[10px] text-emerald-400 font-bold mb-1">تاريخ التسليم</p>
                                        <p className="text-sm font-bold text-emerald-900">{formatDate(project.delivery_date || projectData.delivery_date)}</p>
                                    </div>
                                </div>
                                <DetailRow label="الحالة" value={project.status || 'قيد العمل'} isTotal={false} />
                                <DetailRow label="الموقع" value={project.location || '-'} isTotal={false} />
                                <DetailRow label="النوع" value={getProjectTypeArabic(project.project_type || projectData.project_type)} isTotal={false} />
                            </div>
                        </Card>

                        {/* Total Quantities Summary */}
                        <Card title="إجمالي الكميات" icon={FaChartPie}>
                                <div className="space-y-3">
                                {chartData.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: item.color }} />
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                                <p className="text-[10px] text-gray-400">{item.unit}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-lg text-gray-700">{Math.round(item.value).toLocaleString()}</p>
                                    </div>
                                ))}
                                <div className="pt-2">
                                    <DetailRow label="إجمالي مسطح البناء" value={results.totalArea || 0} unit="م²" isTotal={true} />
                                </div>
                                </div>
                        </Card>
                    </div>

                    {/* BLOCK B: Main Content (Col-8) */}
                    <div className="md:col-span-8 space-y-6">
                        
                        {/* 1. Cost Summary (The Big Financials) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-none shadow-green-200 shadow-xl" title="" action={<FaMoneyBillWave className="text-white/30 text-4xl absolute top-4 left-4" />}>
                                    <div className="relative z-10 p-2">
                                    <p className="text-green-100 font-medium text-sm mb-1">صافي ربح المشروع</p>
                                    <h2 className="text-4xl font-black mb-4 tracking-tight">{formatCurrency(profitValue)}</h2>
                                    
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex justify-between items-center border border-white/10">
                                        <span className="text-sm font-medium">نسبة الربح</span>
                                        <span className="font-bold text-xl">{prices.profitRate || projectData.profitRate || 0}%</span>
                                    </div>
                                    </div>
                                </Card>

                                <Card title="ملخص التكاليف والنتائج النهائية" icon={FaCalculator}>
                                <div className="space-y-0.5 pr-1">
                                    <DetailRow label="تكلفة المواد (تقديري)" value={formatCurrency(materialsCost)} />
                                    <DetailRow label="تكلفة المصنعيات" value={formatCurrency(results.contractorWorkCost)} />
                                    <DetailRow label="المصاريف الإدارية" value={formatCurrency(results.overhead)} />
                                    <DetailRow label="تكلفة العزل" value={formatCurrency(results.insulationCost)} />
                                    <DetailRow label="تكلفة الدفان" value={formatCurrency(results.backfillCost)} />
                                    <div className="h-px bg-gray-100 my-2"></div>
                                    <DetailRow label="مجموع البنود" value={formatCurrency(itemsTotal)} />
                                    <DetailRow label="إجمالي التكاليف (بدون ربح)" value={formatCurrency(costWithoutProfit)} isTotal={true} />
                                </div>
                                </Card>
                        </div>

                        {/* 2. Pricing Standards Grid */}
                        <Card title="معايير التسعير المعتمدة" icon={FaCogs}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <PriceCard label="الخرسانة" value={prices.concretePrice} unit="ريال" icon={FaCube} color="emerald" />
                                <PriceCard label="الحديد" value={prices.steelPrice} unit="ريال" icon={FaIndustry} color="rose" />
                                <PriceCard label="البلوك" value={prices.blockPrice} unit="ريال" icon={FaCube} color="amber" />
                                <PriceCard label="المصنعيات" value={prices.factoryRate} unit="ريال/م²" icon={FaHardHat} color="blue" />
                                
                                <PriceCard label="الدفان" value={prices.backfillPrice} unit="ريال" icon={FaTruck} color="purple" />
                                <PriceCard label="العزل" value={prices.insulationPrice} unit="ريال" icon={FaLayerGroup} color="purple" />
                                <PriceCard label="إدارية" value={prices.overheadRate || 0} unit="ريال" icon={FaCogs} color="blue" />
                                <PriceCard label="الربح" value={prices.profitRate} unit="%" icon={FaMoneyBillWave} color="emerald" />
                            </div>
                        </Card>

                    </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-12 h-[500px]">
                            <TaskManager projectId={project.id} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProjectPage;