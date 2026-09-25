/**
 * نظام التخزين المؤقت الذكي
 * Smart Caching & Memory Management System
 */

/**
 * Cache Manager
 * إدارة التخزين المؤقت للبيانات
 */
class CacheManager {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  /**
   * إضافة عنصر للـ cache
   */
  set(key, value, ttl = 3600000) { // الوقت الافتراضي: ساعة واحدة
    if (this.cache.size >= this.maxSize) {
      // حذف الأقدم استخدام (LRU)
      const oldestKey = this.accessOrder.shift();
      this.cache.delete(oldestKey);
    }

    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
    this.accessOrder.push(key);
  }

  /**
   * الحصول على عنصر من الـ cache
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;

    // التحقق من انتهاء الصلاحية
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // تحديث ترتيب الوصول
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    return item.value;
  }

  /**
   * حذف عنصر من الـ cache
   */
  delete(key) {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
  }

  /**
   * مسح الـ cache بالكامل
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * الحصول على حجم الـ cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * إحصائيات الـ cache
   */
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: `${((this.cache.size / this.maxSize) * 100).toFixed(2)}%`,
    };
  }
}

/**
 * LocalStorage Manager
 * إدارة التخزين المحلي بشكل آمن
 */
class LocalStorageManager {
  constructor(prefix = 'QB_') {
    this.prefix = prefix;
  }

  /**
   * حفظ البيانات
   */
  save(key, data, encrypt = false) {
    try {
      const fullKey = `${this.prefix}${key}`;
      let value = JSON.stringify(data);

      if (encrypt) {
        // تحويل بسيط (للأمان الحقيقي، استخدم مكتبة تشفير)
        value = btoa(value);
      }

      localStorage.setItem(fullKey, value);
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }

  /**
   * استعادة البيانات
   */
  load(key, decrypt = false) {
    try {
      const fullKey = `${this.prefix}${key}`;
      let value = localStorage.getItem(fullKey);

      if (!value) return null;

      if (decrypt) {
        value = atob(value);
      }

      return JSON.parse(value);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * حذف عنصر
   */
  delete(key) {
    try {
      const fullKey = `${this.prefix}${key}`;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
      return false;
    }
  }

  /**
   * مسح جميع البيانات
   */
  clear() {
    try {
      const keysToDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * حجم التخزين المستخدم
   */
  getSize() {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        size += localStorage.getItem(key).length;
      }
    }
    return (size / 1024).toFixed(2); // بالـ KB
  }
}

/**
 * Image Optimizer
 * تحسين الصور
 */
class ImageOptimizer {
  /**
   * ضغط الصورة
   */
  static compressImage(file, quality = 0.8, maxWidth = 1920) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * تحويل الصورة إلى WebP
   */
  static toWebP(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(resolve, 'image/webp');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Performance Analyzer
 * تحليل الأداء
 */
class PerformanceAnalyzer {
  /**
   * قياس الأداء
   */
  static measure(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    const duration = end - start;
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);

    return { result, duration };
  }

  /**
   * قياس الأداء غير المتزامن
   */
  static async measureAsync(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    const duration = end - start;
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);

    return { result, duration };
  }

  /**
   * تقرير الأداء
   */
  static getReport() {
    const entries = performance.getEntries();
    const report = {
      navigation: performance.timing,
      resources: entries.filter(e => e.entryType === 'resource'),
      marks: entries.filter(e => e.entryType === 'mark'),
      measures: entries.filter(e => e.entryType === 'measure'),
    };

    return report;
  }
}

/**
 * Network Optimizer
 * تحسين الشبكة
 */
class NetworkOptimizer {
  /**
   * التحقق من سرعة الشبكة
   */
  static async checkNetworkSpeed() {
    if (!navigator.connection) {
      return 'unknown';
    }

    const effectiveType = navigator.connection.effectiveType;
    return {
      type: effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData,
    };
  }

  /**
   * التحميل المشروط بناءً على السرعة
   */
  static shouldLoadHeavyAssets() {
    if (!navigator.connection) return true;

    const type = navigator.connection.effectiveType;
    return type === '4g'; // حمّل الأصول الثقيلة فقط في 4G
  }

  /**
   * تحميل العالي الجودة أو المنخفضة الجودة
   */
  static getImageQuality() {
    if (!navigator.connection) return 'high';

    const type = navigator.connection.effectiveType;
    switch (type) {
      case '4g':
        return 'high';
      case '3g':
        return 'medium';
      case '2g':
      case 'slow-2g':
        return 'low';
      default:
        return 'medium';
    }
  }
}

// Instances
export const cacheManager = new CacheManager();
export const storageManager = new LocalStorageManager();
export const imageOptimizer = ImageOptimizer;
export const performanceAnalyzer = PerformanceAnalyzer;
export const networkOptimizer = NetworkOptimizer;

export default {
  CacheManager,
  LocalStorageManager,
  ImageOptimizer,
  PerformanceAnalyzer,
  NetworkOptimizer,
  cacheManager,
  storageManager,
  imageOptimizer,
  performanceAnalyzer,
  networkOptimizer,
};
