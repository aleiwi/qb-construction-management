import React from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import { motion } from 'framer-motion';
import { 
  FaExclamationTriangle, 
  FaCalculator, 
  FaChartLine, 
  FaCog, 
  FaFileAlt,
  FaTools,
  FaBuilding,
  FaSync
} from 'react-icons/fa';
import ErrorBoundary from './ErrorBoundary';

// Error Boundary للحاسبة المتقدمة
export const CalculatorErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="bg-white rounded-lg shadow-lg p-6" dir="rtl">
        <div className="flex items-center justify-center mb-4">
          <FaCalculator className="text-red-500 text-4xl" />
        </div>
        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
          خطأ في حاسبة التكاليف
        </h3>
        <p className="text-gray-600 text-center mb-4">
          حدث خطأ في نظام الحسابات. يرجى إعادة المحاولة
        </p>
        <div className="flex justify-center">
          <button
            onClick={resetError}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <FaSync className="ml-2" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Error Boundary للوحة التحكم
export const DashboardErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="bg-white rounded-lg shadow-lg p-8" dir="rtl">
        <div className="flex items-center justify-center mb-6">
          <FaChartLine className="text-red-500 text-5xl" />
        </div>
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
          خطأ في لوحة التحكم
        </h3>
        <p className="text-gray-600 text-center mb-6">
          فشل في تحميل بيانات لوحة التحكم. يرجى إعادة المحاولة
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={resetError}
            className="flex items-center bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            <FaSync className="ml-2" />
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Error Boundary لمحرر المشاريع
export const ProjectEditorErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="bg-white rounded-lg shadow-lg p-6" dir="rtl">
        <div className="flex items-center justify-center mb-4">
          <FaBuilding className="text-red-500 text-4xl" />
        </div>
        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
          خطأ في محرر المشاريع
        </h3>
        <p className="text-gray-600 text-center mb-4">
          حدث خطأ أثناء تحرير المشروع. يرجى إعادة المحاولة
        </p>
        <div className="flex justify-center">
          <button
            onClick={resetError}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <FaSync className="ml-2" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Error Boundary لمدير المواد
export const MaterialsErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="bg-white rounded-lg shadow-lg p-6" dir="rtl">
        <div className="flex items-center justify-center mb-4">
          <FaTools className="text-red-500 text-4xl" />
        </div>
        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
          خطأ في إدارة المواد
        </h3>
        <p className="text-gray-600 text-center mb-4">
          فشل في تحميل بيانات المواد. يرجى إعادة المحاولة
        </p>
        <div className="flex justify-center">
          <button
            onClick={resetError}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <FaSync className="ml-2" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Error Boundary لنظام التقارير
export const ReportsErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="bg-white rounded-lg shadow-lg p-6" dir="rtl">
        <div className="flex items-center justify-center mb-4">
          <FaFileAlt className="text-red-500 text-4xl" />
        </div>
        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
          خطأ في نظام التقارير
        </h3>
        <p className="text-gray-600 text-center mb-4">
          حدث خطأ أثناء إنشاء التقارير. يرجى إعادة المحاولة
        </p>
        <div className="flex justify-center">
          <button
            onClick={resetError}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <FaSync className="ml-2" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Error Boundary لتحليل CAD
export const CADAnalyzerErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="bg-white rounded-lg shadow-lg p-6" dir="rtl">
        <div className="flex items-center justify-center mb-4">
          <FaCog className="text-red-500 text-4xl" />
        </div>
        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
          خطأ في محلل CAD
        </h3>
        <p className="text-gray-600 text-center mb-4">
          فشل في تحليل الملفات. يرجى إعادة المحاولة
        </p>
        <div className="flex justify-center">
          <button
            onClick={resetError}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <FaSync className="ml-2" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// مكون لإعادة محاولة تحميل المكونات المتزامنة
export const AsyncErrorBoundary = ({ children, fallback }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <FaExclamationTriangle className="text-red-500 text-2xl mx-auto mb-2" />
          <p className="text-gray-600 text-sm mb-3">
            فشل في تحميل هذا المحتوى
          </p>
          <button
            onClick={resetError}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Error Boundary لمركز التنبؤات الذكية
export const AIPredictiveErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="bg-white rounded-lg shadow-lg p-8" dir="rtl">
        <div className="flex items-center justify-center mb-6">
          <FaChartLine className="text-red-500 text-5xl" />
        </div>
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
          خطأ في مركز التنبؤات الذكية
        </h3>
        <p className="text-gray-600 text-center mb-6">
          فشل في تحميل بيانات التنبؤات الذكية. يرجى إعادة المحاولة
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={resetError}
            className="flex items-center bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            <FaSync className="ml-2" />
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Error Boundary لمركز إدارة الطوارئ
export const EmergencyManagementErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="bg-white rounded-lg shadow-lg p-8" dir="rtl">
        <div className="flex items-center justify-center mb-6">
          <FaExclamationTriangle className="text-red-500 text-5xl" />
        </div>
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
          خطأ في مركز إدارة الطوارئ
        </h3>
        <p className="text-gray-600 text-center mb-6">
          فشل في تحميل نظام إدارة الطوارئ والسلامة. يرجى إعادة المحاولة
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={resetError}
            className="flex items-center bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
          >
            <FaSync className="ml-2" />
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Error Boundary للمساعد الذكي
export const SmartAssistantErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="bg-white rounded-lg shadow-lg p-8" dir="rtl">
        <div className="flex items-center justify-center mb-6">
          <FaCog className="text-red-500 text-5xl" />
        </div>
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
          خطأ في المساعد الذكي
        </h3>
        <p className="text-gray-600 text-center mb-6">
          فشل في تحميل المساعد الذكي. يرجى إعادة المحاولة
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={resetError}
            className="flex items-center bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
          >
            <FaSync className="ml-2" />
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Hook للتحقق من الأخطاء في المكونات
export const useErrorHandler = () => {
  const reportError = React.useCallback((error, context = {}) => {
    console.error('🔴 Error reported:', error, context);
    
    // حفظ الأخطاء في التخزين المحلي
    const errors = JSON.parse(localStorage.getItem('qb_component_errors') || '[]');
    errors.push({
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
    
    // الاحتفاظ بآخر 20 خطأ
    if (errors.length > 20) {
      errors.splice(0, errors.length - 20);
    }
    
    localStorage.setItem('qb_component_errors', JSON.stringify(errors));
  }, []);

  return { reportError };
};