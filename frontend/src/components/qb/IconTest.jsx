// اختبار جميع الأيقونات المستخدمة في المكونات الجديدة
// للتأكد من أنها تعمل بشكل صحيح بدون أخطاء

import React from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import {
  // الأيقونات من AdvancedCostMonitor
  FaMoneyBillWave,
  FaChartPie,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp, // تم الإصلاح من FaTrendingUp
  FaArrowDown, // تم الإصلاح من FaTrendingDown
  FaCalculator,
  FaBell,
  FaFileInvoiceDollar,
  FaCoins,
  FaBalanceScale,
  
  // الأيقونات من ProjectTimelineManager
  FaCalendarAlt,
  FaClock,
  FaChartLine,
  FaPlay,
  FaPause,
  FaFlag,
  FaUsers,
  FaTasks,
  
  // الأيقونات من ProgressTracker
  FaTrophy,
  FaBullseye,
  FaCalendarCheck,
  FaBuilding,
  FaHammer,
  FaEye,
  FaStar,
  FaRocket,
  
  // الأيقونات من AdvancedProjectDashboard
  FaTimes,
  FaExpand,
  FaCompress,
  
  // الأيقونات من ProjectReportGenerator
  FaFilePdf,
  FaFileExcel,
  FaPrint,
  FaDownload,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt
} from 'react-icons/fa';

const IconTest = () => {
  const icons = [
    // AdvancedCostMonitor icons
    { name: 'FaMoneyBillWave', component: FaMoneyBillWave, category: 'Cost Monitor' },
    { name: 'FaChartPie', component: FaChartPie, category: 'Cost Monitor' },
    { name: 'FaExclamationTriangle', component: FaExclamationTriangle, category: 'Cost Monitor' },
    { name: 'FaCheckCircle', component: FaCheckCircle, category: 'Cost Monitor' },
    { name: 'FaArrowUp', component: FaArrowUp, category: 'Cost Monitor (Fixed)' },
    { name: 'FaArrowDown', component: FaArrowDown, category: 'Cost Monitor (Fixed)' },
    { name: 'FaCalculator', component: FaCalculator, category: 'Cost Monitor' },
    { name: 'FaBell', component: FaBell, category: 'Cost Monitor' },
    { name: 'FaFileInvoiceDollar', component: FaFileInvoiceDollar, category: 'Cost Monitor' },
    { name: 'FaCoins', component: FaCoins, category: 'Cost Monitor' },
    { name: 'FaBalanceScale', component: FaBalanceScale, category: 'Cost Monitor' },
    
    // ProjectTimelineManager icons
    { name: 'FaCalendarAlt', component: FaCalendarAlt, category: 'Timeline Manager' },
    { name: 'FaClock', component: FaClock, category: 'Timeline Manager' },
    { name: 'FaChartLine', component: FaChartLine, category: 'Timeline Manager' },
    { name: 'FaPlay', component: FaPlay, category: 'Timeline Manager' },
    { name: 'FaPause', component: FaPause, category: 'Timeline Manager' },
    { name: 'FaFlag', component: FaFlag, category: 'Timeline Manager' },
    { name: 'FaUsers', component: FaUsers, category: 'Timeline Manager' },
    { name: 'FaTasks', component: FaTasks, category: 'Timeline Manager' },
    
    // ProgressTracker icons
    { name: 'FaTrophy', component: FaTrophy, category: 'Progress Tracker' },
    { name: 'FaBullseye', component: FaBullseye, category: 'Progress Tracker' },
    { name: 'FaCalendarCheck', component: FaCalendarCheck, category: 'Progress Tracker' },
    { name: 'FaBuilding', component: FaBuilding, category: 'Progress Tracker' },
    { name: 'FaHammer', component: FaHammer, category: 'Progress Tracker' },
    { name: 'FaEye', component: FaEye, category: 'Progress Tracker' },
    { name: 'FaStar', component: FaStar, category: 'Progress Tracker' },
    { name: 'FaRocket', component: FaRocket, category: 'Progress Tracker' },
    
    // AdvancedProjectDashboard icons
    { name: 'FaTimes', component: FaTimes, category: 'Project Dashboard' },
    { name: 'FaExpand', component: FaExpand, category: 'Project Dashboard' },
    { name: 'FaCompress', component: FaCompress, category: 'Project Dashboard' },
    
    // ProjectReportGenerator icons
    { name: 'FaFilePdf', component: FaFilePdf, category: 'Report Generator' },
    { name: 'FaFileExcel', component: FaFileExcel, category: 'Report Generator' },
    { name: 'FaPrint', component: FaPrint, category: 'Report Generator' },
    { name: 'FaDownload', component: FaDownload, category: 'Report Generator' },
    { name: 'FaUser', component: FaUser, category: 'Report Generator' },
    { name: 'FaPhone', component: FaPhone, category: 'Report Generator' },
    { name: 'FaEnvelope', component: FaEnvelope, category: 'Report Generator' },
    { name: 'FaMapMarkerAlt', component: FaMapMarkerAlt, category: 'Report Generator' }
  ];

  // تجميع الأيقونات حسب الفئة
  const iconsByCategory = icons.reduce((acc, icon) => {
    if (!acc[icon.category]) {
      acc[icon.category] = [];
    }
    acc[icon.category].push(icon);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        🧪 اختبار جميع الأيقونات - المكونات الجديدة
      </h1>
      
      {Object.entries(iconsByCategory).map(([category, categoryIcons]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-600 border-b pb-2">
            📂 {category}
          </h2>
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {categoryIcons.map((icon) => {
              const IconComponent = icon.component;
              return (
                <div
                  key={icon.name}
                  className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <IconComponent className="text-2xl text-blue-600 mb-2" />
                  <span className="text-xs text-center text-gray-600 font-medium">
                    {icon.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-bold text-green-800 mb-2">
          ✅ اختبار مكتمل
        </h3>
        <p className="text-green-700">
          تم تحميل جميع الأيقونات بنجاح! إجمالي الأيقونات: <strong>{icons.length}</strong>
        </p>
        <p className="text-sm text-green-600 mt-2">
          ملاحظة: تم إصلاح <code>FaTrendingDown</code> إلى <code>FaArrowDown</code>
        </p>
      </div>
    </div>
  );
};

export default IconTest;