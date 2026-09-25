/**
 * مكون عرض المعايير الهندسية المتقدمة
 * Advanced Engineering Standards Display Component
 */

import React, { useState } from 'react';
import {
  FaChartBar,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLightbulb,
  FaFileAlt,
  FaTabletAlt,
  FaDownload,
  FaBook,
  FaTools,
  FaGlobeAsia,
} from 'react-icons/fa';

export const AdvancedEngineeringStandards = ({ 
  engineeringData, 
  projectData, 
  darkMode = false,
  onExportStandards = null 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    steel: true,
    concrete: true,
    loads: false,
    safety: false,
    recommendations: false,
    seismic: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!engineeringData) {
    return (
      <div className={`p-6 rounded-lg text-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          📊 لم تتم الحسابات الهندسية بعد
        </p>
      </div>
    );
  }

  const { steelAnalysis, concreteAnalysis, loads, safetyChecks, advancedMetrics, recommendations, seismicInfo } = engineeringData;

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════
          1. قسم تحليل الحديد
          ═══════════════════════════════════════════════════════ */}
      
      <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <button
          onClick={() => toggleSection('steel')}
          className={`w-full p-4 flex items-center justify-between ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
          } transition-colors`}
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
              <FaChartBar className="text-white" />
            </div>
            <div>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                🔨 تحليل الحديد (Steel Analysis)
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {steelAnalysis?.totalQty?.toFixed(2)} طن - {steelAnalysis?.estimatedBars} قضيب
              </p>
            </div>
          </div>
          <span className={`transform transition-transform ${expandedSections.steel ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {expandedSections.steel && (
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  الكمية الإجمالية
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {steelAnalysis?.totalQty?.toFixed(2)}
                </p>
                <p className="text-xs mt-1">طن</p>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  عدد القضبان المقدرة
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {steelAnalysis?.estimatedBars}
                </p>
                <p className="text-xs mt-1">قضيب</p>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  القطر المقترح
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  Ø {steelAnalysis?.suggestedDiameter}
                </p>
                <p className="text-xs mt-1">ملم</p>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-orange-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  نسبة التسليح
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {(parseFloat(steelAnalysis?.reinforcementRatio) * 100).toFixed(2)}%
                </p>
                <p className="text-xs mt-1">من الخرسانة</p>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ℹ️ معلومات إضافية
              </p>
              <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>• القطر المقترح يعتمد على التحليل الهندسي</li>
                <li>• نسبة التسليح ضمن المعايير الدولية والمحلية</li>
                <li>• تحقق من حساب الأربطة والأساور</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. قسم تحليل الخرسانة
          ═══════════════════════════════════════════════════════ */}
      
      <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <button
          onClick={() => toggleSection('concrete')}
          className={`w-full p-4 flex items-center justify-between ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
          } transition-colors`}
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
              <FaFileAlt className="text-white" />
            </div>
            <div>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                🏗️ تحليل الخرسانة (Concrete Analysis)
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {concreteAnalysis?.totalVolume?.toFixed(2)} م³ - نوع: {concreteAnalysis?.concreteType}
              </p>
            </div>
          </div>
          <span className={`transform transition-transform ${expandedSections.concrete ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {expandedSections.concrete && (
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-amber-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  الحجم الإجمالي
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  {concreteAnalysis?.totalVolume?.toFixed(2)}
                </p>
                <p className="text-xs mt-1">م³</p>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  الوزن الإجمالي
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {(concreteAnalysis?.totalWeight / 1000).toFixed(1)}
                </p>
                <p className="text-xs mt-1">طن</p>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-lime-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  الحمل الميت
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
                  {concreteAnalysis?.deadLoadPerMeter}
                </p>
                <p className="text-xs mt-1">كN/م²</p>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  نوع الخرسانة
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  {concreteAnalysis?.concreteType}
                </p>
                <p className="text-xs mt-1">مقاومة الضغط</p>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                📋 التفاصيل
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                التكلفة المقدرة: <span className="font-bold">{concreteAnalysis?.estimatedCost} ريال</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. قسم الأحمال
          ═══════════════════════════════════════════════════════ */}
      
      <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <button
          onClick={() => toggleSection('loads')}
          className={`w-full p-4 flex items-center justify-between ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
          } transition-colors`}
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500">
              <FaTools className="text-white" />
            </div>
            <div>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                ⚙️ تحليل الأحمال (Load Analysis)
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                حمل التصميم: {loads?.designLoad} كN/م²
              </p>
            </div>
          </div>
          <span className={`transform transition-transform ${expandedSections.loads ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {expandedSections.loads && (
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-pink-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  الحمل الميت
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                  {loads?.deadLoad}
                </p>
                <p className="text-xs mt-1">كN/م²</p>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-rose-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  الحمل الحي
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                  {loads?.liveLoad}
                </p>
                <p className="text-xs mt-1">كN/م²</p>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-orange-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  حمل التصميم
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {loads?.designLoad}
                </p>
                <p className="text-xs mt-1">كN/م²</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          NEW: 4. قسم التحليل الزلزالي
          ═══════════════════════════════════════════════════════ */}
      {seismicInfo && (
        <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('seismic')}
            className={`w-full p-4 flex items-center justify-between ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            } transition-colors`}
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500">
                <FaGlobeAsia className="text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  🌍 التحليل الزلزالي (Seismic Analysis)
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {seismicInfo.description}
                </p>
              </div>
            </div>
            <span className={`transform transition-transform ${expandedSections.seismic ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {expandedSections.seismic && (
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-red-50'}`}>
                  <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    معلومات المنطقة الزلزالية (حسب SBC)
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {seismicInfo.description} (معامل التسارع: {seismicInfo.acceleration})
                  </p>
                   <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    * يجب أخذ هذه المعاملات في الاعتبار عند التصميم الإنشائي التفصيلي للمبنى.
                  </p>
                </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          5. قسم فحوصات الأمان
          ═══════════════════════════════════════════════════════ */}
      
      {safetyChecks && safetyChecks.length > 0 && (
        <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('safety')}
            className={`w-full p-4 flex items-center justify-between ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            } transition-colors`}
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                <FaExclamationTriangle className="text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  ⚠️ فحوصات الأمان (Safety Checks)
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {safetyChecks.length} تنبيهات
                </p>
              </div>
            </div>
            <span className={`transform transition-transform ${expandedSections.safety ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {expandedSections.safety && (
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
              {safetyChecks.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-4 ${
                    check.severity === 'critical' 
                      ? `${darkMode ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-500'}`
                      : check.severity === 'high'
                      ? `${darkMode ? 'bg-orange-900/20 border-orange-500' : 'bg-orange-50 border-orange-500'}`
                      : `${darkMode ? 'bg-yellow-900/20 border-yellow-500' : 'bg-yellow-50 border-yellow-500'}`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-bold text-sm ${
                        check.severity === 'critical' ? darkMode ? 'text-red-400' : 'text-red-600' :
                        check.severity === 'high' ? darkMode ? 'text-orange-400' : 'text-orange-600' :
                        darkMode ? 'text-yellow-400' : 'text-yellow-600'
                      }`}>
                        {check.message}
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        💡 {check.action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          6. التوصيات
          ═══════════════════════════════════════════════════════ */}
      
      {recommendations && recommendations.length > 0 && (
        <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={() => toggleSection('recommendations')}
            className={`w-full p-4 flex items-center justify-between ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            } transition-colors`}
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                <FaLightbulb className="text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  💡 التوصيات (Recommendations)
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {recommendations.length} توصيات
                </p>
              </div>
            </div>
            <span className={`transform transition-transform ${expandedSections.recommendations ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {expandedSections.recommendations && (
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} space-y-3`}>
              {recommendations.map((rec, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-green-50'}`}>
                  <p className={`font-bold text-sm mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                    {rec.title}
                  </p>
                  <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {rec.items.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          7. أزرار التصدير والمرجعيات
          ═══════════════════════════════════════════════════════ */}
      
      <div className="flex flex-wrap gap-3">
        <button
          className="flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium hover:shadow-lg transition-all"
          onClick={onExportStandards}
        >
          <FaDownload />
          <span>تصدير التقرير</span>
        </button>

        <button
          className="flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium hover:shadow-lg transition-all"
        >
          <FaBook />
          <span>المعايير والمراجع</span>
        </button>
      </div>
    </div>
  );
};

export default AdvancedEngineeringStandards;
