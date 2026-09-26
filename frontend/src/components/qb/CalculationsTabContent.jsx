/**
 * Advanced Calculations Tab Content Component
 * مكون الحسابات المتقدمة والتقارير النهائية
 */

import React, { useState, useRef } from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import { motion } from 'framer-motion';
import { 
  CalculatorIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CubeIcon,
  HomeIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  PrinterIcon,
  ShareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const CalculationsTabContent = ({ results, calculationSettings }) => {
  const [expandedSections, setExpandedSections] = useState({
    structural: true,
    finishing: false,
    electrical: false,
    plumbing: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: calculationSettings.currency || 'SAR'
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('ar-SA').format(number);
  };

  const downloadReport = () => {
    // هنا يمكن إضافة منطق تحميل التقرير
    toast.success('جاري تحضير التقرير للتحميل...');
  };

  const printReport = () => {
    window.print();
  };

  const shareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: 'تقرير حسابات المشروع',
        text: `إجمالي التكلفة: ${formatCurrency(results.summary.grandTotal)}`,
      });
    } else {
      toast.info('تم نسخ رابط التقرير');
    }
  };

  const calculationSections = [
    {
      id: 'structural',
      title: 'الأعمال الإنشائية',
      icon: CubeIcon,
      color: 'purple',
      data: results.calculations.structural,
      description: 'الخرسانة والحديد والأعمال الإنشائية الأساسية'
    },
    {
      id: 'finishing',
      title: 'أعمال التشطيبات',
      icon: HomeIcon,
      color: 'orange',
      data: results.calculations.finishing,
      description: 'البلاط والدهانات والأبواب والنوافذ'
    },
    {
      id: 'electrical',
      title: 'الأعمال الكهربائية',
      icon: BoltIcon,
      color: 'yellow',
      data: results.calculations.electrical,
      description: 'الإضاءة والمقابس والمفاتيح الكهربائية'
    },
    {
      id: 'plumbing',
      title: 'أعمال السباكة',
      icon: WrenchScrewdriverIcon,
      color: 'teal',
      data: results.calculations.plumbing,
      description: 'نقاط المياه والصرف والتركيبات الصحية'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4">
          <CalculatorIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          الحسابات المتقدمة والتقرير النهائي
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          تقرير شامل لجميع التكاليف والكميات مع تفاصيل دقيقة لكل بند من بنود المشروع
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-bold text-blue-900">المجموع الفرعي</h3>
              <p className="text-sm text-blue-700">قبل الهامش والضريبة</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(results.summary.subtotal)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-bold text-green-900">هامش الربح</h3>
              <p className="text-sm text-green-700">{calculationSettings.profitMargin}%</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(results.summary.profit)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <DocumentArrowDownIcon className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="font-bold text-orange-900">ضريبة القيمة المضافة</h3>
              <p className="text-sm text-orange-700">{calculationSettings.vatRate}%</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(results.summary.vat)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircleIcon className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-bold text-purple-900">الإجمالي النهائي</h3>
              <p className="text-sm text-purple-700">شامل جميع التكاليف</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrency(results.summary.grandTotal)}
          </p>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          تحميل التقرير PDF
        </button>
        <button
          onClick={printReport}
          className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors font-semibold"
        >
          <PrinterIcon className="w-5 h-5" />
          طباعة التقرير
        </button>
        <button
          onClick={shareReport}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
        >
          <ShareIcon className="w-5 h-5" />
          مشاركة التقرير
        </button>
      </div>

      {/* Detailed Calculations */}
      <div className="space-y-6">
        {calculationSections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
          >
            {/* Section Header */}
            <div
              onClick={() => toggleSection(section.id)}
              className={`px-6 py-4 bg-gradient-to-r from-${section.color}-50 to-${section.color}-100 border-b border-${section.color}-200 cursor-pointer hover:from-${section.color}-100 hover:to-${section.color}-150 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-${section.color}-600 rounded-xl`}>
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-${section.color}-900 text-xl`}>
                      {section.title}
                    </h3>
                    <p className={`text-${section.color}-700`}>
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className={`font-bold text-${section.color}-900 text-lg`}>
                      {formatCurrency(
                        section.data.reduce((sum, item) => sum + (item.totalCost || 0), 0)
                      )}
                    </p>
                    <p className={`text-sm text-${section.color}-700`}>
                      {section.data.length} بند
                    </p>
                  </div>
                  {expandedSections[section.id] ? (
                    <ChevronUpIcon className={`w-6 h-6 text-${section.color}-600`} />
                  ) : (
                    <ChevronDownIcon className={`w-6 h-6 text-${section.color}-600`} />
                  )}
                </div>
              </div>
            </div>

            {/* Section Content */}
            {expandedSections[section.id] && (
              <div className="p-6">
                {section.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            البند
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            الكمية
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            الوحدة
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            سعر الوحدة
                          </th>
                          {section.id === 'structural' && (
                            <>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                الخرسانة (م³)
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                الحديد (كجم)
                              </th>
                            </>
                          )}
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            الإجمالي
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {section.data.map((item, itemIndex) => (
                          <motion.tr
                            key={itemIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: itemIndex * 0.05 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {item.itemType}
                              </div>
                              {item.specifications && (
                                <div className="text-sm text-gray-500">
                                  {JSON.stringify(item.specifications, null, 2)
                                    .replace(/[{}"]/g, '')
                                    .split(',')
                                    .slice(0, 2)
                                    .join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                              {formatNumber(item.quantity || item.specifications?.area || item.specifications?.count || '-')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                              {item.unit || 'متر مربع'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                              {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                            </td>
                            {section.id === 'structural' && (
                              <>
                                <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                                  {item.concreteVolume ? formatNumber(item.concreteVolume) : '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                                  {item.steelQuantity ? formatNumber(item.steelQuantity) : '-'}
                                </td>
                              </>
                            )}
                            <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-900">
                              {formatCurrency(item.totalCost)}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <section.icon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>لا توجد بيانات في هذا القسم</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Final Summary */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
        <h3 className="font-bold text-gray-900 text-2xl mb-6 text-center">ملخص المشروع النهائي</h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Cost Breakdown */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg mb-4">تفصيل التكاليف</h4>
            {calculationSections.map((section) => {
              const sectionTotal = section.data.reduce((sum, item) => sum + (item.totalCost || 0), 0);
              return (
                <div key={section.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">{section.title}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(sectionTotal)}</span>
                </div>
              );
            })}
            <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 font-bold text-lg">
              <span className="text-gray-800">المجموع الفرعي</span>
              <span className="text-gray-900">{formatCurrency(results.summary.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">هامش الربح ({calculationSettings.profitMargin}%)</span>
              <span className="font-semibold text-green-600">{formatCurrency(results.summary.profit)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">ضريبة القيمة المضافة ({calculationSettings.vatRate}%)</span>
              <span className="font-semibold text-orange-600">{formatCurrency(results.summary.vat)}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-t-2 border-gray-400 text-xl font-bold">
              <span className="text-gray-900">الإجمالي النهائي</span>
              <span className="text-purple-600">{formatCurrency(results.summary.grandTotal)}</span>
            </div>
          </div>

          {/* Project Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-lg mb-4">إعدادات الحساب</h4>
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">العملة</span>
                <span className="font-medium">{calculationSettings.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">هامش الربح</span>
                <span className="font-medium">{calculationSettings.profitMargin}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ضريبة القيمة المضافة</span>
                <span className="font-medium">{calculationSettings.vatRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">التشطيبات</span>
                <span className="font-medium">{calculationSettings.includeFinishing ? '✅ مشمولة' : '❌ مستبعدة'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الكهرباء</span>
                <span className="font-medium">{calculationSettings.includeElectrical ? '✅ مشمولة' : '❌ مستبعدة'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">السباكة</span>
                <span className="font-medium">{calculationSettings.includePlumbing ? '✅ مشمولة' : '❌ مستبعدة'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CalculationsTabContent;