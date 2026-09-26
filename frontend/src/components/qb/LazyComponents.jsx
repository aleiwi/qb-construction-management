/**
 * مكونات محملة ببطء لتحسين الأداء
 * Quantum Build - Performance Optimization
 */

import React, { lazy, Suspense } from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import { motion } from 'framer-motion';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

// مكون تحميل متقدم
const AdvancedLoader = ({ message = 'جاري التحميل...', variant = 'default' }) => {
  const loaderVariants = {
    default: (
      <div className="flex flex-col items-center justify-center p-8" dir="rtl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full mb-4"
        />
        <p className="text-gray-600 text-lg font-medium">{message}</p>
      </div>
    ),
    dots: (
      <div className="flex flex-col items-center justify-center p-8" dir="rtl">
        <div className="flex space-x-2 mb-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              className="w-3 h-3 bg-primary-500 rounded-full"
            />
          ))}
        </div>
        <p className="text-gray-600 text-lg font-medium">{message}</p>
      </div>
    ),
    pulse: (
      <div className="flex flex-col items-center justify-center p-8" dir="rtl">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full mb-4 flex items-center justify-center"
        >
          <FaSpinner className="text-white text-2xl" />
        </motion.div>
        <p className="text-gray-600 text-lg font-medium">{message}</p>
      </div>
    )
  };

  return loaderVariants[variant] || loaderVariants.default;
};

// مكون خطأ التحميل
const LoadingError = ({ error, retry, componentName = 'Component' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg" dir="rtl">
      <FaExclamationTriangle className="text-red-500 text-4xl mb-4" />
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        فشل في تحميل {componentName}
      </h3>
      <p className="text-red-600 text-center mb-4">
        {error?.message || 'حدث خطأ غير متوقع'}
      </p>
      <button
        onClick={retry}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
      >
        إعادة المحاولة
      </button>
    </div>
  );
};

// مكونات محملة ببطء مع Error Boundaries

// حاسبة التكاليف مقسمة
export const LazyQuantumCalculator = React.lazy(() => 
  import('./calculator/QuantumBuildCalculator').then(module => ({
    default: module.default
  }))
);

// لوحة التحكم المتقدمة مقسمة
export const LazyDashboard = React.lazy(() => 
  import('./AdvancedDashboard').then(module => ({
    default: module.default
  }))
);

// لوحة التحكم العادية (للاحتياط)
export const LazyBasicDashboard = React.lazy(() => 
  import('./Dashboard').then(module => ({
    default: module.default
  }))
);

// محرر المشاريع مقسمة
export const LazyProjectEditor = React.lazy(() => 
  import('./calculator/QuantumBuildCalculator').then(module => ({
    default: module.default
  }))
);

// محلل CAD مقسمة
export const LazyCADAnalyzer = React.lazy(() => 
  import('./EnhancedCADAnalyzer').then(module => ({
    default: module.default
  }))
);

// مدير المواد مقسمة
export const LazyMaterialsManager = React.lazy(() => 
  import('./MaterialsManager').then(module => ({
    default: module.default
  }))
);



// حاسبة التكاليف المتقدمة مقسمة
export const LazyAdvancedCalculator = React.lazy(() => 
  import('./calculator/AdvancedEngineeringStandards').then(module => ({
    default: module.default
  }))
);

// المكونات المتقدمة الجديدة
export const LazyAIPredictiveCenter = React.lazy(() => 
  import('./AIPredictiveCenter').then(module => ({
    default: module.default
  }))
);

export const LazyEmergencyManagementCenter = React.lazy(() => 
  import('./EmergencyManagementCenter').then(module => ({
    default: module.default
  }))
);

export const LazySmartAssistant = React.lazy(() => 
  import('./SmartAssistant').then(module => ({
    default: module.default
  }))
);

// مكون محمي بالتحميل البطيء
export const LazyProtectedComponent = ({ 
  component: Component, 
  fallback = 'جاري التحميل...',
  errorFallback,
  ...props 
}) => {
  const [error, setError] = React.useState(null);

  const LazyComponent = React.lazy(() => 
    import(Component).then(module => ({
      default: module.default || module
    })).catch(err => {
      setError(err);
      throw err;
    })
  );

  if (error) {
    return errorFallback ? (
      errorFallback(error, () => setError(null))
    ) : (
      <LoadingError 
        error={error} 
        retry={() => setError(null)} 
        componentName={Component.name || 'Component'} 
      />
    );
  }

  return (
    <Suspense 
      fallback={<AdvancedLoader message={fallback} variant="pulse" />}
    >
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Hook للتحكم في التحميل البطيء
export const useLazyComponent = () => {
  const [loadingStates, setLoadingStates] = React.useState({});

  const setLoadingState = React.useCallback((componentName, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [componentName]: isLoading
    }));
  }, []);

  const isLoading = React.useCallback((componentName) => {
    return loadingStates[componentName] || false;
  }, [loadingStates]);

  return { setLoadingState, isLoading, loadingStates };
};

// مكونات تحميل مخصصة
export const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-primary-200 border-t-primary-500',
    accent: 'border-accent-200 border-t-accent-500',
    white: 'border-white border-t-white',
    gray: 'border-gray-200 border-t-gray-500'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeClasses[size]} border-4 border-solid rounded-full ${
        colorClasses[color] || colorClasses.primary
      }`}
    />
  );
};

// مكون تحميل متقدم مع معلومات
export const SmartLoader = ({ 
  message = 'جاري التحميل...', 
  progress = null, 
  variant = 'default',
  showProgress = false 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-48 p-6" dir="rtl">
      <AdvancedLoader message={message} variant={variant} />
      
      {showProgress && progress !== null && (
        <div className="w-full max-w-xs mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-primary-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default {
  LazyQuantumCalculator,
  LazyDashboard,
  LazyBasicDashboard,
  LazyProjectEditor,
  LazyCADAnalyzer,
  LazyMaterialsManager,

  LazyAdvancedCalculator,
  LazyAIPredictiveCenter,
  LazyEmergencyManagementCenter,
  LazySmartAssistant,
  LazyProtectedComponent,
  useLazyComponent,
  LoadingSpinner,
  SmartLoader,
  AdvancedLoader
};