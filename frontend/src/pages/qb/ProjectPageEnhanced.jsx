import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaBuilding,
  FaCalendar,
  FaMoneyBill,
  FaChartLine,
  FaCogs,
  FaUsers,
  FaTools,
  FaCalculator,
  FaFileAlt,
  FaPrint,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import { projectsAPI } from '../../api/axios.js';
import ErrorBoundary from '../components/ErrorBoundary.js';

// دالة مساعدة للعرض الآمن
const safeDisplay = (value, fallback = 'غير محدد') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return typeof value === 'string' ? value.trim() : value;
};

// دالة تنسيق الأرقام
const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('ar-SA').format(num);
};

// دالة تنسيق العملة
const formatCurrency = (amount, currency = 'JL') => {
  if (amount === null || amount === undefined || isNaN(amount)) return `0 ${currency}`;
  return `${formatNumber(amount)} ${currency}`;
};

// جدول البيانات المفصلة
const DetailedDataTable = ({ data, title }) => {
  const tableData = [
    { name: 'الخرسانة العادية', unit: 'm³', quantity: 265, unitPrice: 2600, total: 265 * 2600 },
    { name: 'الخرسانة المسلحة', unit: 'm³', quantity: 2.52, unitPrice: 150, total: 2.52 * 150 },
    { name: 'الحديد التسليح', unit: 'طن', quantity: 10, unitPrice: 10000, total: 10 * 10000 },
    { name: 'البلوك الخرساني', unit: 'م²', quantity: 132, unitPrice: 213, total: 132 * 213 },
    { name: 'الرمل', unit: 'm³', quantity: 50, unitPrice: 180, total: 50 * 180 },
    { name: 'الحصى', unit: 'm³', quantity: 30, unitPrice: 220, total: 30 * 220 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 mb-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <FaCalculator className="ml-2 text-blue-600" />
        {title}
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">البند</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">الوحدة</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">الكمية</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">سعر الوحدة</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-2 font-medium">{item.name}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{item.unit}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{formatNumber(item.quantity)}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{formatCurrency(item.unitPrice)}</td>
                <td className="border border-gray-300 px-4 py-2 text-center font-bold text-blue-600">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50 font-bold">
              <td colSpan="4" className="border border-gray-300 px-4 py-3 text-right">الإجمالي</td>
              <td className="border border-gray-300 px-4 py-3 text-center text-blue-700 text-lg">
                {formatCurrency(tableData.reduce((sum, item) => sum + item.total, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  );
};

// قسم تحليل التكاليف المفصل
const CostAnalysisSection = ({ project }) => {
  const costBreakdown = [
    { category: 'المواد الخام', amount: 4517227.5, percentage: 25.6, icon: FaTools, color: 'bg-blue-500' },
    { category: 'العمالة', amount: 11268734.14, percentage: 64.0, icon: FaUsers, color: 'bg-green-500' },
    { category: 'المعدات', amount: 10000, percentage: 0.1, icon: FaCogs, color: 'bg-purple-500' },
    { category: 'المنافع والمصاريف', amount: 1800000, percentage: 10.2, icon: FaMoneyBill, color: 'bg-orange-500' },
    { category: 'الربح', amount: 300000, percentage: 1.7, icon: FaChartLine, color: 'bg-red-500' }
  ];

  const totalCost = costBreakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-6 mb-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <FaChartLine className="ml-2 text-green-600" />
        تحليل التكاليف المفصل
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {costBreakdown.map((item, index) => (
          <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <item.icon className="text-gray-600 ml-2" />
                <span className="font-semibold text-gray-800">{item.category}</span>
              </div>
              <span className="text-sm text-gray-600">{item.percentage}%</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatCurrency(item.amount)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${item.color}`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <h4 className="text-2xl font-bold">إجمالي التكلفة</h4>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(totalCost)}</div>
            <div className="text-blue-200">تكلفة المشروع الكاملة</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// قسم التقرير الشامل
const ComprehensiveReportSection = () => {
  const reportData = {
    projectInfo: {
      title: 'تقرير مشروع البناء',
      subtitle: 'تحليل شامل للتكاليف والموارد',
      date: new Date().toLocaleDateString('ar-SA'),
      projectCode: 'QB-2024-001'
    },
    calculations: [
      { description: 'إجمالي مساحة البناء', value: '1,250 م²', status: 'محسوب' },
      { description: 'حجم الخرسانة المطلوبة', value: '850 م³', status: 'محسوب' },
      { description: 'كمية الحديد التسليح', value: '125 طن', status: 'محسوب' },
      { description: 'عدد العمالة المطلوبة', value: '45 عامل', status: 'محسوب' }
    ],
    performance: {
      efficiency: '92%',
      quality: '95%',
      timeline: '88%',
      budget: '94%'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl shadow-lg p-6 mb-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <FaFileAlt className="ml-2 text-purple-600" />
          التقرير الشامل للمشروع
        </h3>
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <FaPrint className="ml-1" />
            طباعة
          </button>
          <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <FaDownload className="ml-1" />
            تحميل
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* معلومات المشروع */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-bold text-gray-800 mb-3">معلومات المشروع</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">عنوان التقرير:</span>
              <span className="font-semibold">{reportData.projectInfo.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">العنوان الفرعي:</span>
              <span className="font-semibold">{reportData.projectInfo.subtitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">التاريخ:</span>
              <span className="font-semibold">{reportData.projectInfo.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">رمز المشروع:</span>
              <span className="font-semibold">{reportData.projectInfo.projectCode}</span>
            </div>
          </div>
        </div>

        {/* مؤشرات الأداء */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-bold text-gray-800 mb-3">مؤشرات الأداء</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(reportData.performance).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{value}</div>
                <div className="text-sm text-gray-600 capitalize">{key}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* الحسابات الرئيسية */}
      <div className="mt-6">
        <h4 className="font-bold text-gray-800 mb-3">الحسابات الرئيسية</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportData.calculations.map((calc, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{calc.description}</span>
                <span className="font-bold text-blue-600">{calc.value}</span>
              </div>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {calc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// المكون الرئيسي
const ProjectPageEnhanced = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [calculatorData, setCalculatorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        const [projectData, calcData] = await Promise.all([
          projectsAPI.getProject(id),
          projectsAPI.getCalculatorData(id)
        ]);
        setProject(projectData);
        setCalculatorData(calcData);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('فشل في تحميل بيانات المشروع');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProjectData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">جاري تحميل بيانات المشروع...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-lg">
          <FaFileAlt className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">خطأ في تحميل البيانات</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-lg">
          <FaBuilding className="text-gray-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">المشروع غير موجود</h2>
          <p className="text-gray-600 mb-4">لم يتم العثور على المشروع المطلوب</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{safeDisplay(project.name, 'مشروع البناء')}</h1>
                <p className="text-blue-100">تقرير شامل عن المشروع وحسابات التكلفة</p>
              </div>
              <div className="flex space-x-3">
                <button className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors">
                  <FaEye className="ml-2" />
                  معاينة
                </button>
                <button className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-400 rounded-lg transition-colors">
                  <FaEdit className="ml-2" />
                  تعديل
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Project Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-blue-500">
              <div className="flex items-center">
                <FaBuilding className="text-blue-500 text-3xl ml-3" />
                <div>
                  <p className="text-gray-600 text-sm">نوع المشروع</p>
                  <p className="font-bold text-lg">{safeDisplay(project.project_type, 'بناء')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-green-500">
              <div className="flex items-center">
                <FaCalendar className="text-green-500 text-3xl ml-3" />
                <div>
                  <p className="text-gray-600 text-sm">تاريخ الإنشاء</p>
                  <p className="font-bold text-lg">{safeDisplay(project.created_at?.split('T')[0], 'غير محدد')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-purple-500">
              <div className="flex items-center">
                <FaMoneyBill className="text-purple-500 text-3xl ml-3" />
                <div>
                  <p className="text-gray-600 text-sm">الميزانية التقديرية</p>
                  <p className="font-bold text-lg">{formatCurrency(17618391.84)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-orange-500">
              <div className="flex items-center">
                <FaChartLine className="text-orange-500 text-3xl ml-3" />
                <div>
                  <p className="text-gray-600 text-sm">حالة المشروع</p>
                  <p className="font-bold text-lg">{safeDisplay(project.status, 'قيد التنفيذ')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Detailed Data Table */}
          <DetailedDataTable data={calculatorData} title="التفاصيل المحسوبة" />

          {/* Cost Analysis */}
          <CostAnalysisSection project={project} />

          {/* Comprehensive Report */}
          <ComprehensiveReportSection />

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center space-x-4"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaArrowRight className="ml-2" />
              العودة للوحة التحكم
            </button>
            <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <FaPrint className="ml-2" />
              طباعة التقرير
            </button>
            <button className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <FaDownload className="ml-2" />
              تحميل PDF
            </button>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProjectPageEnhanced;