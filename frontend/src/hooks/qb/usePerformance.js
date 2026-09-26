/**
 * Hooks محسّنة للأداء
 * Performance Optimization Hooks
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Hook لتجنب re-rendering غير الضروري
 * Prevents unnecessary re-renders
 */
export const useStableCallback = (callback, dependencies = []) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args) => callbackRef.current(...args), dependencies);
};

/**
 * Hook لـ Debounce
 * Debounces a value after a delay
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook لـ Throttle
 * Throttles a function call
 */
export const useThrottle = (callback, limit = 300) => {
  const inThrottle = useRef(false);

  return useCallback((...args) => {
    if (!inThrottle.current) {
      callback(...args);
      inThrottle.current = true;
      setTimeout(() => {
        inThrottle.current = false;
      }, limit);
    }
  }, [callback, limit]);
};

/**
 * Hook لـ Lazy Loading للصور
 * Lazy loads images when they enter viewport
 */
export const useLazyImage = (imageRef) => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, [imageRef]);
};

/**
 * Hook لتخزين البيانات مع Memoization
 * Memoizes expensive calculations
 */
export const useMemoAsync = (asyncFn, dependencies = []) => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const executeAsync = async () => {
      try {
        setLoading(true);
        const result = await asyncFn();
        if (isMounted) {
          setState(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setState(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    executeAsync();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { state, loading, error };
};

/**
 * Hook لتحسين الأداء باستخدام requestAnimationFrame
 * Uses RAF for smooth animations
 */
export const useAnimationFrame = (callback) => {
  const requestRef = useRef();

  useEffect(() => {
    const animate = () => {
      callback();
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback]);
};

/**
 * Hook لمراقبة الأداء
 * Monitors performance metrics
 */
export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    if (window.performance && window.performance.mark) {
      const markName = `${componentName}-render`;
      window.performance.mark(`${markName}-start`);

      return () => {
        window.performance.mark(`${markName}-end`);
        try {
          window.performance.measure(markName, `${markName}-start`, `${markName}-end`);
          const measure = window.performance.getEntriesByName(markName)[0];
          if (measure && measure.duration > 50) {
            console.warn(`⚠️ ${componentName} took ${measure.duration.toFixed(2)}ms to render`);
          }
        } catch (e) {
          console.warn('Performance monitoring not available');
        }
      };
    }
  }, [componentName]);
};

/**
 * Hook لتتبع استخدام الذاكرة
 * Tracks memory usage
 */
export const useMemoryMonitor = () => {
  useEffect(() => {
    if (performance.memory) {
      const checkMemory = () => {
        const used = performance.memory.usedJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        const percentage = (used / limit) * 100;

        if (percentage > 80) {
          console.warn(`⚠️ Memory usage is high: ${percentage.toFixed(2)}%`);
        }
      };

      const interval = setInterval(checkMemory, 5000);
      return () => clearInterval(interval);
    }
  }, []);
};

