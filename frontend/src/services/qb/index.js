// تصدير جميع الخدمات
export { default as api } from "./api";
export { default as calculationService } from './calculationService';
export { default as projectService } from './projectService';
export { default as reportService } from './reportService';

// دالة شاملة لفحص اتصال الخادم
export const checkServerConnection = async () => {
  try {
    const { checkConnection } = await import('./api');
    const isConnected = await checkConnection();
    
    if (isConnected) {
      console.log('✅ الاتصال بالخادم ناجح');
    } else {
      console.warn('⚠️ لا يمكن الوصول إلى الخادم - سيتم استخدام الحسابات المحلية');
    }
    
    return isConnected;
  } catch (error) {
    console.error('خطأ في فحص اتصال الخادم:', error);
    return false;
  }
};