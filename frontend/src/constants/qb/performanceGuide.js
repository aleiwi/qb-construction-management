/**
 * نصائح تحسين الأداء الاحترافية
 * Professional Performance Optimization Tips
 */

export const performanceOptimizationGuide = {
  // ═══════════════════════════════════════════════════════
  // 1. تقسيم الكود (Code Splitting)
  // ═══════════════════════════════════════════════════════
  codeSplitting: {
    description: 'تقسيم الكود الكبير إلى أجزاء صغيرة تُحمّل عند الحاجة',
    methods: [
      {
        name: 'Dynamic Imports',
        example: `
const Reports = lazy(() => import('./Reports.jsx'));

// الاستخدام
<Suspense fallback={<LoadingFallback />}>
  <Reports />
</Suspense>
        `,
        benefits: 'تقليل حجم البناء الأولي بنسبة 40-60%'
      },
      {
        name: 'Route-based Splitting',
        example: `
const routes = [
  { path: '/calculator', component: lazy(() => import('./Calculator')) },
  { path: '/reports', component: lazy(() => import('./Reports')) },
];
        `,
        benefits: 'تحميل المكونات فقط عند الحاجة إليها'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // 2. Memoization و React.memo
  // ═══════════════════════════════════════════════════════
  memoization: {
    description: 'تخزين مؤقت للحسابات والمكونات',
    tips: [
      {
        title: 'useMemo للحسابات',
        example: `
const result = useMemo(() => {
  return expensiveCalculation(data);
}, [data]); // تُعاد الحسابة فقط عند تغيير data
        `
      },
      {
        title: 'React.memo للمكونات',
        example: `
const MyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
}); // لا تُعاد الرسابة إذا لم تتغير Props
        `
      },
      {
        title: 'useCallback للدوال',
        example: `
const handleClick = useCallback(() => {
  doSomething(data);
}, [data]); // الدالة لا تتغير إذا لم تتغير الـ dependencies
        `
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // 3. تحسين الصور (Image Optimization)
  // ═══════════════════════════════════════════════════════
  imageOptimization: {
    description: 'تقليل حجم الصور وتسريع التحميل',
    strategies: [
      {
        name: 'Lazy Loading',
        code: 'استخدم intersection observer لتحميل الصور عند ظهورها'
      },
      {
        name: 'WebP Format',
        code: 'استخدم صور بصيغة WebP (أصغر بنسبة 25-30%)'
      },
      {
        name: 'Responsive Images',
        code: 'استخدم srcset لتقديم أحجام مختلفة حسب الجهاز'
      },
      {
        name: 'Compression',
        code: 'اضغط الصور قبل الرفع (ImageOptim, TinyPNG, Squoosh)'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // 4. تحسين CSS و JavaScript
  // ═══════════════════════════════════════════════════════
  assetOptimization: {
    css: [
      'استخدم CSS Grid و Flexbox بدلاً من CSS عقيد',
      'قلل استخدام @import في CSS',
      'استخدم CSS Variables لتقليل التكرار',
      'حذف CSS غير المستخدم (PurgeCSS)',
      'استخدم Tailwind CSS للكود الأقل'
    ],
    javascript: [
      'حذف console.log في الإنتاج',
      'استخدم Tree Shaking',
      'قلل استخدام Polyfills',
      'استخدم terser للضغط',
      'استخدم gzip compression'
    ]
  },

  // ═══════════════════════════════════════════════════════
  // 5. إدارة الحالة (State Management)
  // ═══════════════════════════════════════════════════════
  stateManagement: {
    description: 'تقليل re-renders غير الضرورية',
    solutions: [
      {
        name: 'Zustand',
        benefits: 'خفيف الوزن، أداء عالية'
      },
      {
        name: 'Context + useReducer',
        benefits: 'حل مدمج بدون مكتبات',
        note: 'استخدم عندما تحتاج قيماً ثابتة'
      },
      {
        name: 'Recoil',
        benefits: 'تحديثات ذرية، أداء ممتازة'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // 6. تحسين الشبكة (Network Optimization)
  // ═══════════════════════════════════════════════════════
  networkOptimization: {
    strategies: [
      'استخدم CDN لتوزيع المحتوى',
      'قلل عدد requests عن طريق bundling',
      'استخدم HTTP/2 Server Push',
      'فعّل compression على الخادم (gzip, brotli)',
      'استخدم Service Workers للـ offline support',
      'Cache بذكاء باستخدام Cache-Control headers'
    ]
  },

  // ═══════════════════════════════════════════════════════
  // 7. معايير الأداء (Performance Metrics)
  // ═══════════════════════════════════════════════════════
  performanceMetrics: {
    description: 'المقاييس الرئيسية لقياس الأداء',
    metrics: [
      {
        name: 'First Contentful Paint (FCP)',
        target: '< 1.8s',
        description: 'الوقت الذي يظهر فيه أول محتوى'
      },
      {
        name: 'Largest Contentful Paint (LCP)',
        target: '< 2.5s',
        description: 'الوقت الذي يظهر فيه أكبر محتوى'
      },
      {
        name: 'Cumulative Layout Shift (CLS)',
        target: '< 0.1',
        description: 'عدم استقرار التخطيط أثناء التحميل'
      },
      {
        name: 'First Input Delay (FID)',
        target: '< 100ms',
        description: 'التأخير عند التفاعل الأول'
      },
      {
        name: 'Time to Interactive (TTI)',
        target: '< 3.8s',
        description: 'الوقت الذي تصبح فيه الصفحة تفاعلية'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // 8. أدوات المراقبة (Monitoring Tools)
  // ═══════════════════════════════════════════════════════
  monitoringTools: [
    {
      name: 'Google Lighthouse',
      url: 'https://developers.google.com/web/tools/lighthouse',
      features: 'تحليل شامل للأداء والـ SEO والـ accessibility'
    },
    {
      name: 'WebPageTest',
      url: 'https://www.webpagetest.org/',
      features: 'اختبار من مواقع مختلفة وسرعات مختلفة'
    },
    {
      name: 'Chrome DevTools',
      url: 'مدمج في المتصفح',
      features: 'تحليل وقت التحميل والـ profiling'
    },
    {
      name: 'Sentry',
      url: 'https://sentry.io/',
      features: 'مراقبة الأخطاء والأداء في الإنتاج'
    }
  ],

  // ═══════════════════════════════════════════════════════
  // 9. قائمة التحقق (Performance Checklist)
  // ═══════════════════════════════════════════════════════
  checklist: [
    '✅ تقسيم الكود (Code Splitting)',
    '✅ تحسين الصور (WebP, Lazy Loading)',
    '✅ ضغط الملفات (gzip, brotli)',
    '✅ Memoization للعمليات الثقيلة',
    '✅ إزالة البرامج غير المستخدمة',
    '✅ Caching strategy',
    '✅ CDN usage',
    '✅ HTTP/2 Server Push',
    '✅ Service Workers',
    '✅ Lighthouse score > 90',
    '✅ Core Web Vitals في الأخضر',
    '✅ Monitoring و Analytics'
  ]
};

export default performanceOptimizationGuide;
