import React from 'react';
import {
  FaFilePdf,
  FaFileExcel,
  FaPrint,
  FaDownload,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaChartLine,
  FaBuilding,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrophy,
  FaRocket
} from 'react-icons/fa';

const ProjectReportGenerator = ({ 
  projectData, 
  items = [], 
  results = null,
  darkMode = false,
  onExport 
}) => {
  if (!results) {
    return (
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white/80'}`}>
        <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          قم بحساب التكاليف أولاً لإنشاء التقرير
        </p>
      </div>
    );
  }

  const generateReport = (format) => {
    const reportData = {
      project: projectData,
      items: items,
      results: results,
      generatedAt: new Date().toISOString(),
      summary: {
        totalCost: results.totalCost,
        finalPrice: results.finalPrice,
        totalArea: results.totalArea,
        itemsCount: items.length,
        completionPercentage: 67 // Simulated
      }
    };
    
    if (onExport) {
      onExport(reportData, format);
    } else {
      // Default export logic
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تقرير_مشروع_${projectData.name || 'غير_محدد'}_${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className={`p-6 rounded-xl border ${
      darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <FaFilePdf className="ml-2 text-red-500" />
          تصدير تقرير شامل
        </h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={printReport}
            className={`px-4 py-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <FaPrint className="ml-1" />
            طباعة
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="space-y-6">
        {/* Project Header */}
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                🏗️ {projectData.name || 'مشروع جديد'}
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {projectData.description || 'بدون وصف'}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full ${
              darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
            }`}>
              <span className="font-bold">قيد التنفيذ</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <FaCalendarAlt className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>تاريخ البداية</p>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {projectData.startDate || 'غير محدد'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <FaClock className={`${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>تاريخ التسليم</p>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {projectData.deliveryDate || 'غير محدد'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <FaBuilding className={`${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>نوع المشروع</p>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {projectData.projectType || 'سكني'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <FaMapMarkerAlt className={`${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الموقع</p>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {projectData.location || 'غير محدد'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <h4 className={`text-lg font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <FaMoneyBillWave className="ml-2 text-green-500" />
            الملخص المالي
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>إجمالي التكلفة</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {typeof results.totalCost === 'string' 
                  ? parseInt(results.totalCost.replace(/,/g, '')).toLocaleString()
                  : results.totalCost?.toLocaleString()} ريال
              </p>
            </div>
            
            <div className="text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>السعر النهائي</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {typeof results.finalPrice === 'string' 
                  ? parseInt(results.finalPrice.replace(/,/g, '')).toLocaleString()
                  : results.finalPrice?.toLocaleString()} ريال
              </p>
            </div>
            
            <div className="text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>المساحة الإجمالية</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {results.totalArea || 0} م²
              </p>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <h4 className={`text-lg font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <FaChartLine className="ml-2 text-blue-500" />
            ملخص التقدم
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                67%
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>التقدم الإجمالي</p>
              <div className={`w-full bg-gray-200 rounded-full h-2 mt-2 ${darkMode ? 'bg-gray-600' : ''}`}>
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                92%
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>جودة العمل</p>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                darkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                96%
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>مستوى السلامة</p>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                darkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                89%
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الكفاءة الزمنية</p>
            </div>
          </div>
        </div>

        {/* Key Milestones */}
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <h4 className={`text-lg font-bold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <FaTrophy className="ml-2 text-yellow-500" />
            المعالم الرئيسية
          </h4>
          
          <div className="space-y-3">
            {[
              { name: 'التخطيط والتصميم', status: 'completed', date: '2024-01-15' },
              { name: 'التراخيص والموافقات', status: 'completed', date: '2024-01-28' },
              { name: 'الأعمال الأرضية', status: 'in-progress', date: '2024-02-10' },
              { name: 'الأعمال الخرسانية', status: 'pending', date: '2024-03-01' },
              { name: 'الأعمال النهائية', status: 'pending', date: '2024-04-15' }
            ].map((milestone, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  {milestone.status === 'completed' ? (
                    <FaCheckCircle className="text-green-500" />
                  ) : milestone.status === 'in-progress' ? (
                    <FaClock className="text-blue-500" />
                  ) : (
                    <FaExclamationTriangle className="text-gray-400" />
                  )}
                  <span className={`${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {milestone.name}
                  </span>
                </div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {milestone.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center space-x-4 space-x-reverse">
          <button
            onClick={() => generateReport('pdf')}
            className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2 space-x-reverse ${
              darkMode 
                ? 'bg-red-700 hover:bg-red-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <FaFilePdf />
            <span>تصدير PDF</span>
          </button>
          
          <button
            onClick={() => generateReport('excel')}
            className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2 space-x-reverse ${
              darkMode 
                ? 'bg-green-700 hover:bg-green-600 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <FaFileExcel />
            <span>تصدير Excel</span>
          </button>
          
          <button
            onClick={() => generateReport('json')}
            className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2 space-x-reverse ${
              darkMode 
                ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FaDownload />
            <span>تحميل JSON</span>
          </button>
        </div>
        
        <p className={`text-center text-sm mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          💡 سيتم تضمين جميع البيانات المالية والجدولة الزمنية في التقرير
        </p>
      </div>
    </div>
  );
};

export default ProjectReportGenerator;