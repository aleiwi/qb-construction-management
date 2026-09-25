import React from 'react';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaSync, FaHome, FaBug } from 'react-icons/fa';
import { useErrorMonitoring } from '../../utils/qb/utils/errorMonitoring';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // تسجيل الخطأ في نظام المراقبة المتقدم
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // تسجيل الخطأ في نظام المراقبة المتقدم
    const errorId = this.logToMonitoring(error, errorInfo);
    
    console.error('🔴 Error Boundary caught an error:', error, errorInfo);
    console.log(`📝 Error logged with ID: ${errorId}`);
  };

  logToMonitoring = (error, errorInfo) => {
    try {
      // محاولة الحصول على خدمة مراقبة الأخطاء
      if (typeof window !== 'undefined' && window.errorMonitoring) {
        return window.errorMonitoring.logError({
          type: 'boundary',
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          componentName: this.props.componentName || 'Unknown'
        });
      }
    } catch (monitoringError) {
      console.warn('Failed to log to monitoring system:', monitoringError);
    }
    
    // حفظ محلي احتياطي
    const errorReport = {
      id: Date.now().toString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      componentName: this.props.componentName || 'Unknown'
    };
    
    try {
      const previousErrors = JSON.parse(localStorage.getItem('qb_boundary_errors') || '[]');
      previousErrors.push(errorReport);
      
      if (previousErrors.length > 20) {
        previousErrors.splice(0, previousErrors.length - 20);
      }
      
      localStorage.setItem('qb_boundary_errors', JSON.stringify(previousErrors));
      return errorReport.id;
    } catch (storageError) {
      console.warn('Failed to save error locally:', storageError);
      return errorReport.id;
    }
  };

  handleRetry = () => {
    if (this.state.retryCount < 3) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false } = this.props;
      
      if (Fallback) {
        return <Fallback error={this.state.error} resetError={this.handleReset} />;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4"
              >
                <FaExclamationTriangle className="text-red-500 text-3xl" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-800 mb-2"
              >
                حدث خطأ غير متوقع
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 text-lg"
              >
                نعتذر عن الإزعاج. حدث خطأ في النظام وأحتاج لإعادة تشغيل هذا الجزء.
              </motion.p>
            </div>

            {showDetails && this.state.error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-100 rounded-lg p-4 mb-6 text-left text-sm"
              >
                <div className="flex items-center mb-2">
                  <FaBug className="text-red-500 mr-2" />
                  <span className="font-semibold">تفاصيل الخطأ:</span>
                </div>
                <div className="font-mono text-red-600 break-all">
                  {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-600">تفاصيل تقنية</summary>
                    <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={this.handleRetry}
                disabled={this.state.retryCount >= 3}
                className="flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <FaSync className="ml-2" />
                إعادة المحاولة ({3 - this.state.retryCount})
              </button>
              
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <FaHome className="ml-2" />
                إعادة تحميل الصفحة
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-sm text-gray-500"
            >
              إذا استمر هذا الخطأ، يرجى{' '}
              <a href="/contact" className="text-blue-500 hover:underline">
                الاتصال بالدعم الفني
              </a>
            </motion.div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// مكون خطأ مبسط للمكونات الصغيرة
export const SimpleErrorBoundary = ({ children, fallback: Fallback }) => {
  return (
    <ErrorBoundary 
      fallback={({ error, resetError }) => (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <FaExclamationTriangle className="text-red-500 ml-2" />
            <span className="text-red-700 font-semibold">خطأ في المكون</span>
          </div>
          <p className="text-red-600 text-sm mb-3">
            فشل في تحميل هذا الجزء من الصفحة
          </p>
          <button
            onClick={resetError}
            className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

// مكون خطأ للصفحات
export const PageErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary 
      showDetails={true}
      fallback={({ error, resetError }) => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">خطأ في الصفحة</h2>
            <p className="text-gray-600 mb-4">
              حدث خطأ أثناء تحميل هذه الصفحة
            </p>
            <div className="space-y-3">
              <button
                onClick={resetError}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;