/**
 * Advanced Multi-Language Support
 * دعم لغات متقدم
 */

import React from 'react';

// ═══════════════════════════════════════════════════════
// 1. Language Context
// ═══════════════════════════════════════════════════════
export const LanguageContext = React.createContext();

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// ═══════════════════════════════════════════════════════
// 2. Translations
// ═══════════════════════════════════════════════════════
export const translations = {
  ar: {
    name: 'العربية',
    direction: 'rtl',
    code: 'ar',
    flag: '🇸🇦',
    
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    close: 'إغلاق',
    search: 'بحث',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    warning: 'تحذير',
    info: 'معلومة',
    
    // Calculator
    calculator: 'حاسبة البناء',
    addItem: 'إضافة بند',
    totalCost: 'التكلفة الإجمالية',
    costPerMeter: 'التكلفة للمتر المربع',
    quantity: 'الكمية',
    price: 'السعر',
    total: 'الإجمالي',
    
    // Materials
    concrete: 'الخرسانة',
    steel: 'الحديد',
    blocks: 'الكتل',
    materials: 'المواد',
    
    // Reports
    report: 'التقرير',
    exportPDF: 'تصدير PDF',
    exportExcel: 'تصدير إكسل',
    printReport: 'طباعة التقرير',
    
    // Settings
    settings: 'الإعدادات',
    theme: 'المظهر',
    language: 'اللغة',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    
    // Messages
    confirmDelete: 'هل أنت متأكد من حذف هذا البند؟',
    saveSuccess: 'تم الحفظ بنجاح',
    deleteSuccess: 'تم الحذف بنجاح',
    errorMessage: 'حدث خطأ أثناء المعالجة',
  },

  en: {
    name: 'English',
    direction: 'ltr',
    code: 'en',
    flag: '🇺🇸',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    
    // Calculator
    calculator: 'Construction Calculator',
    addItem: 'Add Item',
    totalCost: 'Total Cost',
    costPerMeter: 'Cost Per Square Meter',
    quantity: 'Quantity',
    price: 'Price',
    total: 'Total',
    
    // Materials
    concrete: 'Concrete',
    steel: 'Steel',
    blocks: 'Blocks',
    materials: 'Materials',
    
    // Reports
    report: 'Report',
    exportPDF: 'Export PDF',
    exportExcel: 'Export Excel',
    printReport: 'Print Report',
    
    // Settings
    settings: 'Settings',
    theme: 'Theme',
    language: 'Language',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    
    // Messages
    confirmDelete: 'Are you sure you want to delete this item?',
    saveSuccess: 'Saved successfully',
    deleteSuccess: 'Deleted successfully',
    errorMessage: 'An error occurred during processing',
  },
};

// ═══════════════════════════════════════════════════════
// 3. Language Provider Component
// ═══════════════════════════════════════════════════════
export const LanguageProvider = ({ children, initialLanguage = 'ar' }) => {
  const getSavedLanguage = () => {
    const saved = localStorage.getItem('language-preference');
    if (saved && translations[saved]) return saved;

    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang] ? browserLang : initialLanguage;
  };

  const [language, setLanguage] = React.useState(getSavedLanguage());

  React.useEffect(() => {
    localStorage.setItem('language-preference', language);
    document.documentElement.lang = language;
    document.documentElement.dir = translations[language].direction;
    document.documentElement.setAttribute('data-language', language);
  }, [language]);

  const t = React.useCallback((key) => {
    return translations[language]?.[key] || key;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    direction: translations[language].direction,
    isRTL: translations[language].direction === 'rtl',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════
// 4. useTranslate Hook
// ═══════════════════════════════════════════════════════
export const useTranslate = () => {
  const { t } = useLanguage();
  return t;
};

// ═══════════════════════════════════════════════════════
// 5. Translated Text Component
// ═══════════════════════════════════════════════════════
export const T = ({ id, fallback = '' }) => {
  const { t } = useLanguage();
  return <>{t(id) || fallback}</>;
};

// ═══════════════════════════════════════════════════════
// 6. Language Selector Component
// ═══════════════════════════════════════════════════════
export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {Object.entries(translations).map(([code, lang]) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          title={lang.name}
          aria-label={`Switch to ${lang.name}`}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: language === code ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: language === code ? 'var(--color-bgSecondary)' : 'transparent',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontWeight: language === code ? 'bold' : 'normal',
          }}
        >
          {lang.flag} {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// 7. RTL/LTR Utilities
// ═══════════════════════════════════════════════════════
export const useDirectional = () => {
  const { isRTL, direction } = useLanguage();

  const getPosition = (rtlValue, ltrValue) => isRTL ? rtlValue : ltrValue;

  const getStyle = (rtlStyle, ltrStyle) => isRTL ? rtlStyle : ltrStyle;

  return {
    isRTL,
    direction,
    getPosition,
    getStyle,
    marginLeft: isRTL ? 'marginRight' : 'marginLeft',
    marginRight: isRTL ? 'marginLeft' : 'marginRight',
    paddingLeft: isRTL ? 'paddingRight' : 'paddingLeft',
    paddingRight: isRTL ? 'paddingLeft' : 'paddingRight',
    left: isRTL ? 'right' : 'left',
    right: isRTL ? 'left' : 'right',
  };
};

// ═══════════════════════════════════════════════════════
// 8. Date Formatter for Different Locales
// ═══════════════════════════════════════════════════════
export const useLocalizedDate = () => {
  const { language } = useLanguage();

  const formatDate = (date, options = {}) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(new Date(date));
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date));
  };

  const formatDateTime = (date) => {
    return `${formatDate(date)} ${formatTime(date)}`;
  };

  return { formatDate, formatTime, formatDateTime };
};

// ═══════════════════════════════════════════════════════
// 9. Number Formatter for Different Locales
// ═══════════════════════════════════════════════════════
export const useLocalizedNumber = () => {
  const { language } = useLanguage();

  const formatNumber = (number, options = {}) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      ...options,
    }).format(number);
  };

  const formatCurrency = (amount, currency = 'SAR') => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return { formatNumber, formatCurrency };
};

// ═══════════════════════════════════════════════════════
// 10. Pluralization Support
// ═══════════════════════════════════════════════════════
export const pluralize = (count, singular, plural) => {
  if (count === 0) return `لا ${plural}`;
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural}`;
};

// ═══════════════════════════════════════════════════════
// 11. Language-specific Utilities
// ═══════════════════════════════════════════════════════
export const languageUtils = {
  // Arabic number converter
  arabicToEnglishNumbers: (str) => {
    return str.replace(/[٠-٩]/g, (digit) => {
      const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return arabicDigits.indexOf(digit);
    });
  },

  // English to Arabic numbers
  englishToArabicNumbers: (str) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/\d/g, (digit) => arabicDigits[digit]);
  },

  // Check if text is RTL
  isRTLText: (text) => {
    const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F]/g;
    return rtlChars.test(text);
  },
};

// ═══════════════════════════════════════════════════════
// 12. Translation Validation Utility
// ═══════════════════════════════════════════════════════
export const validateTranslations = () => {
  const arKeys = Object.keys(translations.ar);
  const enKeys = Object.keys(translations.en);

  const missing = {
    ar: enKeys.filter(k => !arKeys.includes(k)),
    en: arKeys.filter(k => !enKeys.includes(k)),
  };

  return {
    isValid: missing.ar.length === 0 && missing.en.length === 0,
    missing,
  };
};

// ═══════════════════════════════════════════════════════
// 13. Dynamic Translation Loading
// ═══════════════════════════════════════════════════════
export const addTranslations = (language, newTranslations) => {
  if (translations[language]) {
    translations[language] = {
      ...translations[language],
      ...newTranslations,
    };
  }
};

export default {
  LanguageContext,
  useLanguage,
  translations,
  LanguageProvider,
  useTranslate,
  T,
  LanguageSelector,
  useDirectional,
  useLocalizedDate,
  useLocalizedNumber,
  pluralize,
  languageUtils,
  validateTranslations,
  addTranslations,
};
