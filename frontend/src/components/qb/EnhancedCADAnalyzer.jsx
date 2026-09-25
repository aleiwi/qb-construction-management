/**
 * Enhanced CAD Analyzer Component - المرحلة الثانية
 * QUANTUM BUILD - مكون تحليل ملفات الأوتوكاد المحسن
 * يتضمن: نظام معاينة البيانات، التعديل اليدوي، والحسابات المتقدمة
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  CameraIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CogIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TableCellsIcon,
  CalculatorIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  PresentationChartBarIcon
} from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../../utils/qb/api';
import DataPreviewTabContent from './DataPreviewTabContent';
import CalculationsTabContent from './CalculationsTabContent';
import SettingsTabContent from './SettingsTabContent';

const EnhancedCADAnalyzer = () => {
  const [files, setFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [editableData, setEditableData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [calculationSettings, setCalculationSettings] = useState({
    profitMargin: 15,
    vatRate: 15,
    currency: 'SAR',
    includeFinishing: true,
    includeElectrical: true,
    includePlumbing: true
  });
  
  const fileInputRef = useRef(null);

  // أنواع الملفات المدعومة
  const supportedTypes = {
    'application/dxf': ['dxf'],
    'application/pdf': ['pdf'],
    'image/*': ['png', 'jpg', 'jpeg', 'tiff', 'bmp']
  };

  // بيانات التشطيبات والأعمال الإضافية
  const finishingItems = {
    flooring: {
      name: 'أعمال البلاط والأرضيات',
      units: 'متر مربع',
      prices: {
        ceramic: 80,
        porcelain: 120,
        marble: 200,
        parquet: 150
      }
    },
    painting: {
      name: 'أعمال الدهانات',
      units: 'متر مربع',
      prices: {
        interior: 25,
        exterior: 35,
        decorative: 45
      }
    },
    doors: {
      name: 'الأبواب والنوافذ',
      units: 'قطعة',
      prices: {
        wooden_door: 800,
        aluminum_window: 400,
        upvc_window: 600
      }
    }
  };

  const electricalItems = {
    lighting: {
      name: 'الإضاءة',
      units: 'نقطة',
      price: 150
    },
    outlets: {
      name: 'المقابس الكهربائية',
      units: 'نقطة',
      price: 120
    },
    switches: {
      name: 'المفاتيح',
      units: 'نقطة',
      price: 80
    }
  };

  const plumbingItems = {
    water_points: {
      name: 'نقاط المياه',
      units: 'نقطة',
      price: 200
    },
    drainage: {
      name: 'نقاط الصرف',
      units: 'نقطة',
      price: 180
    },
    fixtures: {
      name: 'التركيبات الصحية',
      units: 'قطعة',
      price: 500
    }
  };

  // إعداد drag & drop
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map(rejection => {
        if (rejection.errors.some(e => e.code === 'file-too-large')) {
          return `${rejection.file.name}: الملف كبير جداً (حد أقصى 50MB)`;
        }
        if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
          return `${rejection.file.name}: نوع الملف غير مدعوم`;
        }
        return `${rejection.file.name}: خطأ غير معروف`;
      });
      toast.error(`بعض الملفات لم يتم قبولها:\n${errorMessages.join('\n')}`);
      return;
    }

    if (acceptedFiles.length === 0) {
      toast.error('لم يتم اختيار أي ملفات');
      return;
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type || (file.name.toLowerCase().endsWith('.dxf') ? 'application/dxf' : 'unknown'),
      status: 'pending',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`تم إضافة ${newFiles.length === 1 ? newFiles[0].name : `${newFiles.length} ملفات`} بنجاح`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/dxf': ['.dxf'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10
  });

  // تحليل الملفات مع استخراج البيانات
  const analyzeFiles = async () => {
    if (files.length === 0) {
      toast.error('يرجى رفع ملف واحد على الأقل للتحليل');
      return;
    }

    setAnalyzing(true);
    setActiveTab('preview');
    
    try {
      // محاكاة عملية التحليل المتقدمة
      setTimeout(() => {
        const mockExtractedData = {
          basicDimensions: [
            { id: 1, type: 'الطول الإجمالي', value: 15.5, unit: 'متر', editable: true, category: 'dimensions' },
            { id: 2, type: 'العرض الإجمالي', value: 12.0, unit: 'متر', editable: true, category: 'dimensions' },
            { id: 3, type: 'الارتفاع', value: 3.2, unit: 'متر', editable: true, category: 'dimensions' }
          ],
          areas: [
            { id: 4, type: 'المساحة الإجمالية', value: 186, unit: 'متر مربع', editable: true, category: 'areas' },
            { id: 5, type: 'مساحة البناء', value: 156, unit: 'متر مربع', editable: true, category: 'areas' },
            { id: 6, type: 'المساحة المبنية', value: 140, unit: 'متر مربع', editable: true, category: 'areas' }
          ],
          structuralElements: [
            { id: 7, type: 'الأساسات', area: 186, thickness: 0.8, editable: true, category: 'structural' },
            { id: 8, type: 'الأعمدة', count: 12, crossSection: '30x30', editable: true, category: 'structural' },
            { id: 9, type: 'البلاطات', area: 156, thickness: 0.2, editable: true, category: 'structural' },
            { id: 10, type: 'الجدران', length: 85, thickness: 0.2, editable: true, category: 'structural' }
          ],
          finishingElements: [
            { id: 11, type: 'بلاط السيراميك', area: 120, unit: 'متر مربع', editable: true, category: 'finishing' },
            { id: 12, type: 'دهانات داخلية', area: 300, unit: 'متر مربع', editable: true, category: 'finishing' },
            { id: 13, type: 'الأبواب الخشبية', count: 6, unit: 'قطعة', editable: true, category: 'finishing' },
            { id: 14, type: 'النوافذ الألمنيوم', count: 8, unit: 'قطعة', editable: true, category: 'finishing' }
          ],
          electricalElements: [
            { id: 15, type: 'نقاط الإضاءة', count: 25, unit: 'نقطة', editable: true, category: 'electrical' },
            { id: 16, type: 'المقابس الكهربائية', count: 30, unit: 'نقطة', editable: true, category: 'electrical' },
            { id: 17, type: 'المفاتيح', count: 20, unit: 'نقطة', editable: true, category: 'electrical' }
          ],
          plumbingElements: [
            { id: 18, type: 'نقاط المياه', count: 8, unit: 'نقطة', editable: true, category: 'plumbing' },
            { id: 19, type: 'نقاط الصرف', count: 6, unit: 'نقطة', editable: true, category: 'plumbing' },
            { id: 20, type: 'التركيبات الصحية', count: 4, unit: 'قطعة', editable: true, category: 'plumbing' }
          ],
          metadata: {
            confidence: 87,
            processingTime: '3.2 ثانية',
            fileType: files[0]?.file.type || 'AutoCAD DXF',
            detectedElements: ['خطوط', 'نصوص', 'أبعاد', 'رموز', 'طبقات']
          }
        };
        
        setExtractedData(mockExtractedData);
        setEditableData(JSON.parse(JSON.stringify(mockExtractedData))); // نسخة للتعديل
        setFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
        toast.success('تم التحليل والاستخراج بنجاح! يمكنك الآن مراجعة وتعديل البيانات.');
        setAnalyzing(false);
      }, 4000);

    } catch (error) {
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
      toast.error('خطأ في التحليل: ' + error.message);
      setAnalyzing(false);
    }
  };

  // حفظ التعديلات
  const saveEditedData = () => {
    setExtractedData(JSON.parse(JSON.stringify(editableData)));
    setIsEditing(false);
    toast.success('تم حفظ التعديلات بنجاح!');
    
    // الانتقال تلقائياً إلى الحسابات
    setTimeout(() => {
      calculateAdvanced();
    }, 1000);
  };

  // إلغاء التعديلات
  const cancelEdit = () => {
    setEditableData(JSON.parse(JSON.stringify(extractedData)));
    setIsEditing(false);
    toast.info('تم إلغاء التعديلات');
  };

  // تحديث قيمة في البيانات القابلة للتعديل
  const updateEditableValue = (id, field, value) => {
    setEditableData(prev => {
      const updated = { ...prev };
      
      // البحث في جميع الفئات
      const categories = ['basicDimensions', 'areas', 'structuralElements', 'finishingElements', 'electricalElements', 'plumbingElements'];
      
      categories.forEach(category => {
        if (updated[category]) {
          updated[category] = updated[category].map(item => 
            item.id === id ? { ...item, [field]: parseFloat(value) || value } : item
          );
        }
      });
      
      return updated;
    });
  };

  // حساب متقدم مع جميع البنود
  const calculateAdvanced = () => {
    if (!extractedData) {
      toast.error('لا توجد بيانات للحساب');
      return;
    }

    // حسابات العناصر الإنشائية الأساسية
    const structuralCalculations = calculateStructuralElements(extractedData.structuralElements);
    
    // حسابات التشطيبات
    const finishingCalculations = calculationSettings.includeFinishing ? 
      calculateFinishing(extractedData.finishingElements) : [];
    
    // حسابات الكهرباء
    const electricalCalculations = calculationSettings.includeElectrical ? 
      calculateElectrical(extractedData.electricalElements) : [];
    
    // حسابات السباكة
    const plumbingCalculations = calculationSettings.includePlumbing ? 
      calculatePlumbing(extractedData.plumbingElements) : [];

    // إجمالي التكاليف
    const subtotal = [
      ...structuralCalculations,
      ...finishingCalculations,
      ...electricalCalculations,
      ...plumbingCalculations
    ].reduce((sum, item) => sum + item.totalCost, 0);

    const profit = subtotal * (calculationSettings.profitMargin / 100);
    const vat = (subtotal + profit) * (calculationSettings.vatRate / 100);
    const grandTotal = subtotal + profit + vat;

    const results = {
      calculations: {
        structural: structuralCalculations,
        finishing: finishingCalculations,
        electrical: electricalCalculations,
        plumbing: plumbingCalculations
      },
      summary: {
        subtotal,
        profit,
        vat,
        grandTotal,
        settings: calculationSettings
      },
      metadata: extractedData.metadata
    };
    
    setResults(results);
    setActiveTab('calculations');
    toast.success('تم إنجاز الحسابات المتقدمة بنجاح!');
  };

  // حسابات العناصر الإنشائية
  const calculateStructuralElements = (elements) => {
    return elements.map(element => {
      let concreteVolume = 0;
      let steelQuantity = 0;
      let totalCost = 0;

      switch(element.type) {
        case 'الأساسات':
          concreteVolume = element.area * element.thickness;
          steelQuantity = concreteVolume * 100; // 100 كجم/متر مكعب
          totalCost = (concreteVolume * 350) + (steelQuantity * 3.2);
          break;
        case 'الأعمدة':
          const columnVolume = element.count * 0.3 * 0.3 * 3.2; // افتراض ارتفاع 3.2 متر
          concreteVolume = columnVolume;
          steelQuantity = columnVolume * 120;
          totalCost = (concreteVolume * 400) + (steelQuantity * 3.2);
          break;
        case 'البلاطات':
          concreteVolume = element.area * element.thickness;
          steelQuantity = concreteVolume * 90;
          totalCost = (concreteVolume * 380) + (steelQuantity * 3.2);
          break;
        case 'الجدران':
          const wallVolume = element.length * element.thickness * 3.0; // افتراض ارتفاع 3 متر
          concreteVolume = wallVolume;
          steelQuantity = wallVolume * 80;
          totalCost = (concreteVolume * 320) + (steelQuantity * 3.2);
          break;
      }

      return {
        itemType: element.type,
        specifications: element,
        concreteVolume: Math.round(concreteVolume * 100) / 100,
        steelQuantity: Math.round(steelQuantity),
        totalCost: Math.round(totalCost)
      };
    });
  };

  // حسابات التشطيبات
  const calculateFinishing = (elements) => {
    return elements.map(element => {
      let unitPrice = 0;
      let totalCost = 0;
      
      switch(element.type) {
        case 'بلاط السيراميك':
          unitPrice = finishingItems.flooring.prices.ceramic;
          totalCost = element.area * unitPrice;
          break;
        case 'دهانات داخلية':
          unitPrice = finishingItems.painting.prices.interior;
          totalCost = element.area * unitPrice;
          break;
        case 'الأبواب الخشبية':
          unitPrice = finishingItems.doors.prices.wooden_door;
          totalCost = element.count * unitPrice;
          break;
        case 'النوافذ الألمنيوم':
          unitPrice = finishingItems.doors.prices.aluminum_window;
          totalCost = element.count * unitPrice;
          break;
      }

      return {
        itemType: element.type,
        quantity: element.area || element.count,
        unit: element.unit,
        unitPrice,
        totalCost: Math.round(totalCost)
      };
    });
  };

  // حسابات الكهرباء
  const calculateElectrical = (elements) => {
    return elements.map(element => {
      let unitPrice = 0;
      
      switch(element.type) {
        case 'نقاط الإضاءة':
          unitPrice = electricalItems.lighting.price;
          break;
        case 'المقابس الكهربائية':
          unitPrice = electricalItems.outlets.price;
          break;
        case 'المفاتيح':
          unitPrice = electricalItems.switches.price;
          break;
      }

      return {
        itemType: element.type,
        quantity: element.count,
        unit: element.unit,
        unitPrice,
        totalCost: Math.round(element.count * unitPrice)
      };
    });
  };

  // حسابات السباكة
  const calculatePlumbing = (elements) => {
    return elements.map(element => {
      let unitPrice = 0;
      
      switch(element.type) {
        case 'نقاط المياه':
          unitPrice = plumbingItems.water_points.price;
          break;
        case 'نقاط الصرف':
          unitPrice = plumbingItems.drainage.price;
          break;
        case 'التركيبات الصحية':
          unitPrice = plumbingItems.fixtures.price;
          break;
      }

      return {
        itemType: element.type,
        quantity: element.count,
        unit: element.unit,
        unitPrice,
        totalCost: Math.round(element.count * unitPrice)
      };
    });
  };

  // إزالة ملف
  const removeFile = (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updated;
    });
  };

  // مسح جميع البيانات
  const clearAll = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setResults(null);
    setExtractedData(null);
    setEditableData(null);
    setSelectedFile(null);
    setPreviewMode(false);
    setIsEditing(false);
    setActiveTab('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('تم مسح جميع البيانات');
  };

  // تنسيق حجم الملف
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // حصول على أيقونة نوع الملف
  const getFileIcon = (file) => {
    if (file.type.includes('pdf')) return DocumentTextIcon;
    if (file.type.includes('image')) return CameraIcon;
    return DocumentTextIcon;
  };

  // حصول على لون حالة الملف
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'processing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      {/* Header المحسن */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl mb-6"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <SparklesIcon className="w-10 h-10 text-white" />
          </div>
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            محلل الأوتوكاد المطور - الجيل الثاني
          </motion.h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            استخراج ذكي للأبعاد والمساحات • معاينة وتعديل تفاعلي للبيانات • حسابات متقدمة شاملة
          </p>
        </motion.div>
      </div>

      {/* Enhanced Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
          {[
            { id: 'upload', label: 'رفع الملفات', icon: CloudArrowUpIcon, color: 'blue' },
            { id: 'preview', label: 'معاينة البيانات', icon: TableCellsIcon, color: 'green', disabled: !extractedData },
            { id: 'calculations', label: 'الحسابات المتقدمة', icon: CalculatorIcon, color: 'purple', disabled: !results },
            { id: 'settings', label: 'الإعدادات', icon: AdjustmentsHorizontalIcon, color: 'orange' }
          ].map((tab) => {
            const colorClasses = {
              blue: activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-600 hover:bg-blue-50',
              green: activeTab === tab.id ? 'bg-green-600 text-white shadow-lg' : 'text-green-600 hover:bg-green-50',
              purple: activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-600 hover:bg-purple-50',
              orange: activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg' : 'text-orange-600 hover:bg-orange-50'
            };
            
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`flex items-center px-6 py-3 rounded-xl transition-all font-medium ${
                  tab.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : colorClasses[tab.color]
                }`}
              >
                <tab.icon className="w-5 h-5 ml-2" />
                {tab.label}
                {tab.disabled && (
                  <span className="mr-2 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
                    مقفل
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Upload Tab - محسن */}
        {activeTab === 'upload' && (
          <UploadTabContent 
            key="upload"
            files={files}
            analyzing={analyzing}
            isDragActive={isDragActive}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            fileInputRef={fileInputRef}
            removeFile={removeFile}
            analyzeFiles={analyzeFiles}
            clearAll={clearAll}
            formatFileSize={formatFileSize}
            getFileIcon={getFileIcon}
            getStatusColor={getStatusColor}
            supportedTypes={supportedTypes}
          />
        )}

        {/* Data Preview Tab - جديد */}
        {activeTab === 'preview' && extractedData && (
          <DataPreviewTabContent
            key="preview"
            extractedData={extractedData}
            editableData={editableData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            updateEditableValue={updateEditableValue}
            saveEditedData={saveEditedData}
            cancelEdit={cancelEdit}
            calculateAdvanced={calculateAdvanced}
          />
        )}

        {/* Advanced Calculations Tab - محسن */}
        {activeTab === 'calculations' && results && (
          <CalculationsTabContent
            key="calculations"
            results={results}
            calculationSettings={calculationSettings}
          />
        )}

        {/* Settings Tab - محسن */}
        {activeTab === 'settings' && (
          <SettingsTabContent
            key="settings"
            calculationSettings={calculationSettings}
            setCalculationSettings={setCalculationSettings}
            finishingItems={finishingItems}
            electricalItems={electricalItems}
            plumbingItems={plumbingItems}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// مكون تبويب الرفع
const UploadTabContent = ({ 
  files, analyzing, isDragActive, getRootProps, getInputProps, fileInputRef, 
  removeFile, analyzeFiles, clearAll, formatFileSize, getFileIcon, getStatusColor, supportedTypes 
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-8"
  >
    {/* Enhanced Drag & Drop Area */}
    <div
      {...getRootProps()}
      className={`relative border-3 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer overflow-hidden ${
        isDragActive
          ? 'border-blue-500 bg-blue-50 scale-105'
          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
      }`}
    >
      <input {...getInputProps()} ref={fileInputRef} />
      
      {/* خلفية متحركة */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-purple-50/20 -z-10" />
      
      <motion.div
        animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
        className="relative z-10"
      >
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <CloudArrowUpIcon className="w-12 h-12 text-white" />
        </div>
        
        {isDragActive ? (
          <div>
            <p className="text-2xl text-blue-600 font-bold mb-2">
              🎯 اترك الملفات هنا للتحليل الفوري
            </p>
            <p className="text-blue-500">
              سيتم معالجة الملفات بأحدث تقنيات الذكاء الاصطناعي
            </p>
          </div>
        ) : (
          <div>
            <p className="text-2xl text-gray-700 font-semibold mb-4">
              اسحب ملفات الأوتوكاد هنا أو استخدم الزر أدناه
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold mb-6 inline-flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <CloudArrowUpIcon className="w-6 h-6" />
              اختيار الملفات للتحليل
            </button>
            <div className="text-sm text-gray-500 space-y-2">
              <p className="font-medium">الملفات المدعومة:</p>
              <div className="flex justify-center gap-4 text-xs">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">DXF</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">PDF</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Images</span>
              </div>
              <p>حد أقصى 50MB لكل ملف • دقة عالية مطلوبة للحصول على أفضل النتائج</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>

    {/* Enhanced Files List */}
    {files.length > 0 && (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              الملفات المحددة ({files.length})
            </h3>
            <div className="flex gap-3">
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                مسح الكل
              </button>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {files.map((fileItem) => {
            const FileIcon = getFileIcon(fileItem);
            
            return (
              <motion.div
                key={fileItem.id}
                layout
                className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center flex-1">
                  <div className="p-3 bg-gray-100 rounded-xl ml-4">
                    <FileIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 truncate text-lg">
                      {fileItem.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatFileSize(fileItem.size)} • {fileItem.type || 'DXF'} • 
                      <span className={`mr-2 font-medium ${getStatusColor(fileItem.status)}`}>
                        {fileItem.status === 'pending' && 'جاهز للتحليل'}
                        {fileItem.status === 'processing' && 'جاري المعالجة...'}
                        {fileItem.status === 'completed' && '✅ مكتمل'}
                        {fileItem.status === 'error' && '❌ خطأ'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(fileItem.id)}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="إزالة"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </motion.div>
            );
          })}
        </div>
        
        {/* Enhanced Action Buttons */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50 flex justify-between items-center">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-green-600" />
            {files.length} ملف محدد للتحليل
          </div>
          
          <button
            onClick={analyzeFiles}
            disabled={files.length === 0 || analyzing}
            className={`px-8 py-4 rounded-xl font-bold transition-all text-lg ${
              analyzing
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105'
            }`}
          >
            {analyzing ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                جاري التحليل المتقدم...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <SparklesIcon className="w-5 h-5" />
                بدء التحليل الذكي 🚀
              </div>
            )}
          </button>
        </div>
      </div>
    )}

    {/* Supported Formats Info - محسن */}
    <div className="grid md:grid-cols-3 gap-6">
      {[
        {
          icon: DocumentTextIcon,
          title: 'ملفات CAD',
          description: 'DXF - أفضل دقة لاستخراج الأبعاد',
          color: 'blue',
          features: ['دقة عالية', 'استخراج تلقائي', 'طبقات منفصلة']
        },
        {
          icon: DocumentTextIcon,
          title: 'مستندات PDF',
          description: 'مخططات ومستندات فنية',
          color: 'green',
          features: ['مسح ضوئي', 'تحليل النصوص', 'استخراج الجداول']
        },
        {
          icon: CameraIcon,
          title: 'الصور التقنية',
          description: 'PNG, JPG, TIFF - دقة عالية',
          color: 'purple',
          features: ['ذكاء اصطناعي', 'تمييز الأشكال', 'قياس المقاييس']
        }
      ].map((format, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-6 rounded-2xl border-2 border-${format.color}-200 bg-${format.color}-50 hover:shadow-lg transition-all`}
        >
          <format.icon className={`w-8 h-8 text-${format.color}-600 mb-4`} />
          <h4 className={`font-bold text-${format.color}-900 mb-2 text-lg`}>
            {format.title}
          </h4>
          <p className={`text-${format.color}-700 mb-4`}>
            {format.description}
          </p>
          <div className="space-y-2">
            {format.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircleIcon className={`w-4 h-4 text-${format.color}-600`} />
                <span className={`text-sm text-${format.color}-700`}>{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default EnhancedCADAnalyzer;