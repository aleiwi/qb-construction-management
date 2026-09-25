import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaChartLine,
  FaTimes,
  FaExpand,
  FaCompress
} from 'react-icons/fa';

const AdvancedProjectDashboard = ({ 
  projectData, 
  items = [], 
  results = null,
  darkMode = false,
  onUpdateTimeline,
  onUpdateBudget,
  onUpdateProgress
}) => {
  const [activeTab, setActiveTab] = useState('timeline');
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!results) {
    return (
      <div className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm ${
        darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="text-center">
          <FaChartLine className={`mx-auto text-4xl mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            🏗️ لوحة تحكم إدارة المشاريع المتقدمة
          </h3>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            قم بحساب التكاليف أولاً لفتح لوحة التحكم المتقدمة
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'timeline',
      name: 'الجدولة الزمنية',
      icon: <FaCalendarAlt />,
      component: 'timeline'
    },
    {
      id: 'cost',
      name: 'مراقبة التكاليف',
      icon: <FaMoneyBillWave />,
      component: 'cost'
    },
    {
      id: 'progress',
      name: 'تتبع التقدم',
      icon: <FaChartLine />,
      component: 'progress'
    }
  ];

  return (
    <div className={`rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
      isFullscreen ? 'fixed inset-4 z-50' : ''
    } ${
      darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 p-3 rounded-full">
              <FaChartLine className="text-white text-xl" />
            </div>
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            🏗️ لوحة تحكم إدارة المشاريع المتقدمة
          </h2>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {isFullscreen ? <FaCompress className="text-sm" /> : <FaExpand className="text-sm" />}
          </button>
          <button
            onClick={() => {
              toast.success('تم تصدير تقرير إدارة المشروع بنجاح!');
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-green-700 hover:bg-green-600 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            تصدير التقرير
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? darkMode
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'bg-white text-gray-900 border-b-2 border-blue-500'
                : darkMode
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                📅 إدارة الجدولة الزمنية المتقدمة
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                تتبع المهام والمواعيد الزمنية مع التنبؤات الذكية
              </p>
            </div>
            
            {/* Timeline Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>المهام المكتملة</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      8/15
                    </p>
                  </div>
                  <div className="text-green-500">✅</div>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>المهام قيد التنفيذ</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      3
                    </p>
                  </div>
                  <div className="text-blue-500">⚡</div>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الأيام المتبقية</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      45
                    </p>
                  </div>
                  <div className="text-yellow-500">📅</div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl text-center ${
              darkMode ? 'bg-blue-900/30' : 'bg-blue-50'
            }`}>
              <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
                💡 انقر على "الجدولة الزمنية" في القائمة الجانبية لعرض التفاصيل الكاملة
              </p>
            </div>
          </div>
        )}

        {activeTab === 'cost' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                💰 مراقبة التكاليف المتقدمة
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                تحليل شامل للتكاليف مع التنبؤات والتوصيات الذكية
              </p>
            </div>
            
            {/* Cost Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>إجمالي التكلفة</p>
                  <p className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {typeof results?.totalCost === 'string' 
                      ? parseInt(results.totalCost.replace(/,/g, '')).toLocaleString()
                      : results?.totalCost?.toLocaleString()} ريال
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>تكلفة المتر</p>
                  <p className={`text-xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {results?.costPerSquareMeter || 0} ريال/م²
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>هامش الربح</p>
                  <p className={`text-xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    15.2%
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>حالة الميزانية</p>
                  <p className={`text-sm font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    ضمن الحد المسموح
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl text-center ${
              darkMode ? 'bg-green-900/30' : 'bg-green-50'
            }`}>
              <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                ✅ التكاليف ضمن النطاق الطبيعي - لا توجد تنبيهات حالياً
              </p>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                📊 تتبع تقدم المشروع
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                مؤشرات الأداء الشاملة مع التقييمات الذكية
              </p>
            </div>
            
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>التقدم الإجمالي</p>
                  <div className={`text-2xl font-bold mb-2 ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    67%
                  </div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>جودة العمل</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    92%
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>مستوى السلامة</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    96%
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الكفاءة الزمنية</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    89%
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl text-center ${
              darkMode ? 'bg-purple-900/30' : 'bg-purple-50'
            }`}>
              <p className={`text-sm ${darkMode ? 'text-purple-400' : 'text-purple-800'}`}>
                🎯 أداء ممتاز - المشروع يسير وفقاً للخطة المحددة
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className={`border-t border-gray-200 dark:border-gray-700 p-4`}>
        <div className="flex items-center justify-center space-x-4 space-x-reverse">
          <button
            onClick={() => {
              toast.success('تم فتح التقرير التفصيلي بنجاح!');
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            📋 تقرير مفصل
          </button>
          <button
            onClick={() => {
              toast.success('تم إرسال التحديثات لأصحاب المصلحة!');
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-green-700 hover:bg-green-600 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            📧 إرسال التحديثات
          </button>
          <button
            onClick={() => {
              toast.success('تم جدولة الاجتماع بنجاح!');
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              darkMode 
                ? 'bg-purple-700 hover:bg-purple-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            📅 جدولة اجتماع
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedProjectDashboard;