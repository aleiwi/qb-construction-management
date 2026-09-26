import React, { useState, useRef, useEffect } from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import { motion } from 'framer-motion';
import {
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaPercentage,
  FaCube,
  FaHardHat,
  FaClock,
  FaCheckCircle,
  FaRocket,
  FaLayerGroup,
  FaCalendarAlt,
  FaTimes,
  FaPencilAlt,
  FaCogs,
  FaIndustry,
  FaTruck,
  FaCalculator,
  FaChartPie
} from 'react-icons/fa';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis
} from 'recharts';
import projectService from '../../services/qb/projectService';

// --- Utility Functions ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount || 0);
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

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 hover:border-blue-200 transition-colors group">
            <div className={`p-2.5 rounded-xl ${colorClasses[color] || colorClasses.blue} group-hover:scale-110 transition-transform`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="font-bold text-gray-800 text-sm">
                    {Number(value).toLocaleString()} <span className="text-[10px] font-normal text-gray-400">{unit}</span>
                </p>
            </div>
        </div>
    );
};

const ProjectDetailsModal = ({ project, onClose, onEdit }) => {
    const [calculatorData, setCalculatorData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (project?.id) {
                try {
                    setLoading(true);
                    const data = await projectService.getCalculatorData(project.id);
                    setCalculatorData(data);
                } catch (error) {
                    console.error("Failed to load calculator data", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [project]);

    if (!project) return null;

    // --- Data Extraction ---
    // 1. Identify Data Sources
    const results = calculatorData?.results || {};
    const prices = calculatorData?.prices || {}; // Standard prices
    const projectData = calculatorData?.projectData || {}; // Project settings
    const additionalData = calculatorData?.additionalData || {};

    // 2. Metrics Calculation
    const totalCostNoProfit = parseFloat(results.totalCost || results.totalCostWithoutProfit || 0); 
    
    // Let's deduce "Total Cost Without Profit" as Final Price - Profit.
    const finalPrice = parseFloat(results.finalPrice || project.estimated_cost || 0);
    const profitValue = parseFloat(results.profit || 0);
    const costWithoutProfit = finalPrice - profitValue;

    // "Total Materials Cost" (tklaft al-mawad)
    const materialsCost = parseFloat(results.concreteQty * (prices.concretePrice || 0) + 
                                     results.steelQty * (prices.steelPrice || 0) + 
                                     results.blockQty * (prices.blockPrice || 0)) || 
                                     parseFloat(results.totalCost || 0); 

    // Sum of Items ("مجموع البنود")
    const itemsTotal = parseFloat(results.totalCost || 0);

    // 3. Chart Data
    const chartData = [
        { name: 'الخرسانة', value: parseFloat(results.concreteQty || 0), unit: 'م³', color: '#6366f1' },
        { name: 'الحديد', value: parseFloat(results.steelQty || 0), unit: 'طن', color: '#f43f5e' },
        { name: 'البلوك', value: parseFloat(results.blockQty || 0), unit: 'ألف', color: '#f59e0b' },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#F8FAFC] w-full max-w-6xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]"
            >
                {/* 1. Top Bar */}
                <div className="px-8 py-5 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-blue-200 shadow-lg">
                            <FaCube size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-800">{project.name}</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <FaMapMarkerAlt size={12} /> {project.location || 'الموقع غير محدد'}
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span>{project.project_type || 'عام'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button onClick={() => onEdit(project.id)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
                             <FaPencilAlt /> تعديل
                        </button>
                        <button onClick={onClose} className="p-2.5 bg-gray-100 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                {/* 2. Content Grid */}
                <div className="overflow-y-auto p-8 custom-scrollbar">
                    
                    {loading ? (
                         <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                            <p className="text-gray-400">جاري جلب البيانات الدقيقة...</p>
                         </div>
                    ) : (
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
                                     <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-blue-200 shadow-xl" title="" action={<FaMoneyBillWave className="text-white/30 text-4xl absolute top-4 left-4" />}>
                                         <div className="relative z-10 p-2">
                                            <p className="text-blue-100 font-medium text-sm mb-1">صافي ربح المشروع</p>
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
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ProjectDetailsModal;
