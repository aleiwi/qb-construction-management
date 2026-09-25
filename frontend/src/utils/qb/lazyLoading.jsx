/**
 * نسخة محسّنة من QuantumBuildCalculator مع Lazy Loading
 * Lazy Loading Components Configuration
 */

import React, { lazy, Suspense } from 'react';

// Lazy loaded components
const AdvancedEngineeringStandards = lazy(() =>
  import('./AdvancedEngineeringStandards.jsx')
);

const Reports = lazy(() =>
  import('./Reports.jsx').catch(err => {
    console.error('Failed to load Reports:', err);
    return { default: () => <div>حدث خطأ في تحميل التقارير</div> };
  })
);

const EnhancedCADAnalyzer = lazy(() =>
  import('./EnhancedCADAnalyzer.jsx').catch(err => {
    console.error('Failed to load CAD Analyzer:', err);
    return { default: () => <div>حدث خطأ في تحميل محلل CAD</div> };
  })
);

// Loading Fallback Component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600">جاري التحميل...</p>
    </div>
  </div>
);

// Error Boundary Component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <h2 className="text-red-800 font-bold mb-2">حدث خطأ</h2>
          <p className="text-red-700">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            حاول مرة أخرى
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy Loading Wrapper
 * يوفر تحميل محسّن للمكونات
 */
export const LazyComponent = ({ 
  component: Component, 
  fallback = <LoadingFallback />,
  errorMessage = 'حدث خطأ في تحميل هذا المكون'
}) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Dynamic Import Wrapper
 * للحسابات الثقيلة والعمليات المعقدة
 */
export const useLazyCalculations = () => {
  const [calculations, setCalculations] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const loadCalculations = React.useCallback(async (data) => {
    setLoading(true);
    try {
      // تحميل الحسابات من Worker أو من موقع آخر
      const result = await new Promise(resolve => {
        setTimeout(() => {
          // محاكاة حسابات ثقيلة
          resolve(data);
        }, 100);
      });
      setCalculations(result);
    } catch (error) {
      console.error('Error in lazy calculations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { calculations, loading, loadCalculations };
};

/**
 * Configuration for Lazy Loading
 * تكوين Lazy Loading للمكونات المختلفة
 */
export const lazyComponentConfig = {
  // المكونات التي يتم تحميلها بناءً على الحاجة
  engineeringStandards: {
    component: AdvancedEngineeringStandards,
    loadOnDemand: true,
    preload: false,
  },
  reports: {
    component: Reports,
    loadOnDemand: true,
    preload: false,
  },
  cadAnalyzer: {
    component: EnhancedCADAnalyzer,
    loadOnDemand: true,
    preload: false,
  },
};

/**
 * Preload function
 * لتحميل مسبق للمكونات المهمة
 */
export const preloadComponent = async (componentName) => {
  try {
    await import(`./components/${componentName}.jsx`);
    console.log(`✅ Component ${componentName} preloaded successfully`);
  } catch (error) {
    console.warn(`⚠️ Failed to preload ${componentName}:`, error);
  }
};

/**
 * Route-based Code Splitting
 * تقسيم الكود بناءً على المسارات
 */
export const routeComponentMap = {
  calculator: lazy(() => 
    import('../pages/ProjectPage.jsx').then(m => ({ default: m.default }))
  ),
  analysis: lazy(() => 
    import('./Reports.jsx').then(m => ({ default: m.default }))
  ),
  settings: lazy(() => 
    import('../pages/SettingsPage.jsx').then(m => ({ default: m.default }))
  ),
};

export default {
  AdvancedEngineeringStandards,
  Reports,
  EnhancedCADAnalyzer,
  LoadingFallback,
  ErrorBoundary,
  LazyComponent,
  useLazyCalculations,
  lazyComponentConfig,
  preloadComponent,
  routeComponentMap,
};
