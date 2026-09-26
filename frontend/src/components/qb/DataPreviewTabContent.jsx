/**
 * Data Preview Tab Content Component
 * مكون معاينة وتعديل البيانات المستخرجة
 */

import React from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import { motion } from 'framer-motion';
import { 
  PencilIcon,
  TableCellsIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  CubeIcon,
  SparklesIcon,
  HomeIcon,
  BoltIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DataPreviewTabContent = ({
  extractedData,
  editableData,
  isEditing,
  setIsEditing,
  updateEditableValue,
  saveEditedData,
  cancelEdit,
  calculateAdvanced
}) => {
  const categories = [
    {
      id: 'basicDimensions',
      title: 'الأبعاد الأساسية',
      icon: ChartBarIcon,
      color: 'blue',
      data: editableData?.basicDimensions || []
    },
    {
      id: 'areas',
      title: 'المساحات',
      icon: TableCellsIcon,
      color: 'green',
      data: editableData?.areas || []
    },
    {
      id: 'structuralElements',
      title: 'العناصر الإنشائية',
      icon: CubeIcon,
      color: 'purple',
      data: editableData?.structuralElements || []
    },
    {
      id: 'finishingElements',
      title: 'التشطيبات',
      icon: HomeIcon,
      color: 'orange',
      data: editableData?.finishingElements || []
    },
    {
      id: 'electricalElements',
      title: 'الأعمال الكهربائية',
      icon: BoltIcon,
      color: 'yellow',
      data: editableData?.electricalElements || []
    },
    {
      id: 'plumbingElements',
      title: 'أعمال السباكة',
      icon: WrenchScrewdriverIcon,
      color: 'teal',
      data: editableData?.plumbingElements || []
    }
  ];

  const handleEdit = () => {
    setIsEditing(true);
    toast.info('يمكنك الآن تعديل القيم. انقر على أي رقم لتغييره.');
  };

  const handleSave = () => {
    saveEditedData();
  };

  const handleCancel = () => {
    cancelEdit();
  };

  const handleProceedToCalculations = () => {
    calculateAdvanced();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
          <TableCellsIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          معاينة وتعديل البيانات المستخرجة
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          راجع البيانات المستخرجة من ملفات الأوتوكاد وقم بتعديل أي قيم حسب الحاجة قبل إجراء الحسابات النهائية
        </p>
        
        {/* Confidence Score */}
        {extractedData?.metadata?.confidence && (
          <div className="mt-6 inline-flex items-center gap-3 bg-green-50 px-6 py-3 rounded-xl border border-green-200">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-green-900">دقة الاستخراج</p>
              <p className="text-green-700">{extractedData.metadata.confidence}% من البيانات المستخرجة</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {!isEditing ? (
          <div className="flex gap-4">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              <PencilIcon className="w-5 h-5" />
              تعديل البيانات
            </button>
            <button
              onClick={handleProceedToCalculations}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold"
            >
              <SparklesIcon className="w-5 h-5" />
              متابعة للحسابات
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
            >
              <CheckCircleIcon className="w-5 h-5" />
              حفظ التعديلات
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors font-semibold"
            >
              <XCircleIcon className="w-5 h-5" />
              إلغاء التعديل
            </button>
          </div>
        )}
      </div>

      {/* Data Categories */}
      <div className="grid lg:grid-cols-2 gap-8">
        {categories.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
          >
            {/* Category Header */}
            <div className={`px-6 py-4 bg-gradient-to-r from-${category.color}-50 to-${category.color}-100 border-b border-${category.color}-200`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${category.color}-600 rounded-lg`}>
                  <category.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-${category.color}-900 text-lg`}>
                    {category.title}
                  </h3>
                  <p className={`text-sm text-${category.color}-700`}>
                    {category.data.length} عنصر مستخرج
                  </p>
                </div>
              </div>
            </div>

            {/* Category Data */}
            <div className="p-6 space-y-4">
              {category.data.length > 0 ? (
                category.data.map((item, index) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isEditing={isEditing}
                    updateEditableValue={updateEditableValue}
                    color={category.color}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <category.icon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>لا توجد بيانات في هذه الفئة</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Processing Metadata */}
      {extractedData?.metadata && (
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 text-lg mb-4">معلومات المعالجة</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 mb-1">نوع الملف</p>
              <p className="font-semibold text-gray-900">{extractedData.metadata.fileType}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 mb-1">وقت المعالجة</p>
              <p className="font-semibold text-gray-900">{extractedData.metadata.processingTime}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 mb-1">دقة الاستخراج</p>
              <p className="font-semibold text-green-600">{extractedData.metadata.confidence}%</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 mb-1">العناصر المكتشفة</p>
              <p className="font-semibold text-gray-900">{extractedData.metadata.detectedElements?.length || 0}</p>
            </div>
          </div>
          {extractedData.metadata.detectedElements && (
            <div className="mt-4">
              <p className="text-gray-600 mb-2">العناصر المكتشفة:</p>
              <div className="flex flex-wrap gap-2">
                {extractedData.metadata.detectedElements.map((element, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                    {element}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// مكون صف البيانات القابل للتعديل
const DataRow = ({ item, isEditing, updateEditableValue, color }) => {
  const renderEditableField = (field, value, type = 'number') => {
    if (isEditing) {
      return (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => updateEditableValue(item.id, field, e.target.value)}
          className={`w-full px-3 py-2 border border-${color}-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent`}
          step={type === 'number' ? '0.01' : undefined}
        />
      );
    }
    
    return (
      <span className={`font-semibold text-${color}-600`}>
        {value} {item.unit && field !== 'type' ? item.unit : ''}
      </span>
    );
  };

  return (
    <div className={`p-4 bg-${color}-50 rounded-lg border border-${color}-200 hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-semibold text-${color}-900`}>{item.type}</h4>
        {isEditing && (
          <span className={`text-xs bg-${color}-200 text-${color}-800 px-2 py-1 rounded-full`}>
            قابل للتعديل
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* القيم الأساسية */}
        {item.value !== undefined && (
          <div>
            <p className="text-gray-600 mb-1">القيمة</p>
            {renderEditableField('value', item.value)}
          </div>
        )}
        
        {item.area !== undefined && (
          <div>
            <p className="text-gray-600 mb-1">المساحة</p>
            {renderEditableField('area', item.area)}
          </div>
        )}
        
        {item.thickness !== undefined && (
          <div>
            <p className="text-gray-600 mb-1">السماكة</p>
            {renderEditableField('thickness', item.thickness)}
          </div>
        )}
        
        {item.count !== undefined && (
          <div>
            <p className="text-gray-600 mb-1">العدد</p>
            {renderEditableField('count', item.count)}
          </div>
        )}
        
        {item.length !== undefined && (
          <div>
            <p className="text-gray-600 mb-1">الطول</p>
            {renderEditableField('length', item.length)}
          </div>
        )}
        
        {item.crossSection && (
          <div>
            <p className="text-gray-600 mb-1">المقطع</p>
            {renderEditableField('crossSection', item.crossSection, 'text')}
          </div>
        )}
        
        {item.unit && (
          <div>
            <p className="text-gray-600 mb-1">الوحدة</p>
            <span className={`text-${color}-600 font-medium`}>{item.unit}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPreviewTabContent;