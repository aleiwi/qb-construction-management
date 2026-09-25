/**
 * نظام مراقبة الأخطاء المتقدم - Quantum Build
 * يجمع ويحلل الأخطاء في التطبيق بطريقة آمنة
 */

class ErrorMonitoringService {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.setupGlobalErrorHandling();
  }

  // إعداد معالج الأخطاء العامة
  setupGlobalErrorHandling() {
    // معالج أخطاء JavaScript
    window.addEventListener('error', (event) => {
      // تجاهل أخطاء Supabase authentication
      const isSupabaseAuth = event.message?.includes('auth') || 
                             event.message?.includes('supabase') ||
                             event.message?.includes('oauth_client_id') ||
                             event.message?.includes('missing destination name') ||
                             event.error?.message?.includes('GoTrueClient');
      
      if (!isSupabaseAuth) {
        this.logError({
          type: 'javascript',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          stack: event.error?.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: this.getCurrentUserId()
        });
      }
    });

    // معالج أخطاء Promises
    window.addEventListener('unhandledrejection', (event) => {
      // تجاهل أخطاء Supabase authentication
      const isSupabaseAuth = event.reason?.message?.includes('auth') || 
                             event.reason?.message?.includes('supabase') ||
                             event.reason?.message?.includes('oauth_client_id') ||
                             event.reason?.message?.includes('missing destination name') ||
                             event.reason?.stack?.includes('GoTrueClient');
      
      if (!isSupabaseAuth) {
        this.logError({
          type: 'promise',
          message: event.reason?.message || 'Unhandled Promise Rejection',
          reason: event.reason,
          stack: event.reason?.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: this.getCurrentUserId()
        });
      }
    });

    // مراقبة أخطاء الشبكة بطريقة آمنة
    this.monitorNetworkErrors();
  }

  // مراقبة أخطاء الشبكة (آمنة)
  monitorNetworkErrors() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        return response;
      } catch (error) {
        // تجاهل أخطاء Supabase authentication تماماً
        const isSupabaseAuth = error.message?.includes('auth') || 
                               error.message?.includes('supabase') ||
                               error.message?.includes('token') ||
                               error.message?.includes('Illegal invocation') ||
                               error.message?.includes('Failed to execute') ||
                               error.message?.includes('oauth_client_id') ||
                               error.message?.includes('missing destination name') ||
                               error.stack?.includes('GoTrueClient');
        
        if (!isSupabaseAuth) {
          this.logError({
            type: 'network',
            message: error.message,
            requestUrl: args[0],
            currentUrl: window.location.href,
            method: args[1]?.method || 'GET',
            error: error,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            userId: this.getCurrentUserId()
          });
        }
        throw error;
      }
    };

    // مراقبة XMLHttpRequest أيضاً
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(...args) {
      this._method = args[0];
      this._url = args[1];
      return originalXHROpen.apply(this, args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const xhr = this;
      
      xhr.addEventListener('error', function() {
        const isSupabaseAuth = xhr._url?.includes('supabase') ||
                               xhr._url?.includes('auth');
        
        if (!isSupabaseAuth) {
          xhr._errorMonitoring.logError({
            type: 'xhr',
            message: 'XMLHttpRequest failed',
            requestUrl: xhr._url,
            method: xhr._method,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            userId: xhr._errorMonitoring.getCurrentUserId()
          });
        }
      });

      xhr._errorMonitoring = this;
      return originalXHRSend.apply(this, args);
    };
  }

  // تسجيل خطأ
  logError(errorData) {
    const error = {
      id: this.generateId(),
      ...errorData,
      sessionId: this.getSessionId(),
      timestamp: errorData.timestamp || new Date().toISOString()
    };

    // إضافة للمصفوفة المحلية
    this.errors.push(error);

    // الحفاظ على الحد الأقصى
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // حفظ في localStorage للمراجعة
    this.saveToLocalStorage();

    // إرسال للخادم في الإنتاج
    if (this.isEnabled) {
      this.sendToServer(error);
    }

    // طباعة في وحدة التحكم للمطورين
    if (!this.isEnabled) {
      console.warn('🔴 Error Caught:', error);
    }

    return error;
  }

  // إرسال الأخطاء للخادم
  async sendToServer(error) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error)
      });
    } catch (e) {
      // تجاهل أخطاء إرسال البيانات
    }
  }

  // حفظ في localStorage
  saveToLocalStorage() {
    try {
      const errors = this.errors.slice(-50); // آخر 50 خطأ فقط
      localStorage.setItem('qb_errors', JSON.stringify(errors));
    } catch (e) {
      // تجاهل أخطاء التخزين
    }
  }

  // تحميل من localStorage
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('qb_errors');
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (e) {
      // تجاهل أخطاء التخزين
    }
  }

  // جلب الأخطاء
  getErrors() {
    return [...this.errors];
  }

  // جلب الأخطاء حسب النوع
  getErrorsByType(type) {
    return this.errors.filter(error => error.type === type);
  }

  // جلب آخر خطأ
  getLastError() {
    return this.errors[this.errors.length - 1];
  }

  // مسح الأخطاء
  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem('qb_errors');
    } catch (e) {
      // تجاهل أخطاء التخزين
    }
  }

  // تصدير الأخطاء
  exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }

  // إحصائيات الأخطاء
  getErrorStats() {
    const stats = {
      total: this.errors.length,
      types: {},
      last24Hours: 0
    };

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    this.errors.forEach(error => {
      // عد حسب النوع
      stats.types[error.type] = (stats.types[error.type] || 0) + 1;

      // عد آخر 24 ساعة
      const errorTime = new Date(error.timestamp);
      if (errorTime > yesterday) {
        stats.last24Hours++;
      }
    });

    return stats;
  }

  // إنشاء معرف فريد
  generateId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // الحصول على session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('qb_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('qb_session_id', sessionId);
    }
    return sessionId;
  }

  // الحصول على معرف المستخدم
  getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('qb_user'));
      return user?.id || null;
    } catch (e) {
      return null;
    }
  }

  // إعداد مراقبة الأداء
  setupPerformanceMonitoring() {
    // مراقبة Core Web Vitals
    if ('web-vital' in window) {
      window.webVital.getCLS((metric) => {
        this.logError({
          type: 'performance',
          message: 'Cumulative Layout Shift',
          metric: 'CLS',
          value: metric.value,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      });

      window.webVital.getFID((metric) => {
        this.logError({
          type: 'performance',
          message: 'First Input Delay',
          metric: 'FID',
          value: metric.value,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      });

      window.webVital.getLCP((metric) => {
        this.logError({
          type: 'performance',
          message: 'Largest Contentful Paint',
          metric: 'LCP',
          value: metric.value,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      });
    }

    // مراقبة أخطاء الموارد
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.logError({
          type: 'resource',
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          resourceType: event.target.tagName,
          resourceUrl: event.target.src || event.target.href,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      }
    }, true);
  }

  // مراقبة استخدام الذاكرة (في المتصفحات المدعومة)
  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.logError({
          type: 'memory',
          message: 'Memory usage report',
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      }, 60000); // كل دقيقة
    }
  }

  // بدء مراقبة شاملة
  startMonitoring() {
    this.setupPerformanceMonitoring();
    this.monitorMemoryUsage();
    this.loadFromLocalStorage();
  }

  // إيقاف المراقبة
  stopMonitoring() {
    // يمكن إضافة منطق الإيقاف هنا
  }
}

// إنشاء مثيل واحد من الخدمة
const errorMonitoring = new ErrorMonitoringService();

// بدء المراقبة تلقائياً
if (typeof window !== 'undefined') {
  errorMonitoring.startMonitoring();
}

// تصدير للاستخدام في المكونات
export { errorMonitoring };
export default errorMonitoring;
export { ErrorMonitoringService };

// تصدير دوال مساعدة للتوافق مع المكونات الموجودة
export const createErrorLogger = (componentName) => ({
  log: (message, error = null, context = {}) => {
    errorMonitoring.logError({
      type: 'component',
      component: componentName,
      message,
      error,
      ...context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  }
});

export const useErrorMonitoring = () => ({
  logError: (error) => errorMonitoring.logError(error),
  getErrors: () => errorMonitoring.getErrors(),
  clearErrors: () => errorMonitoring.clearErrors(),
  getStats: () => errorMonitoring.getErrorStats()
});