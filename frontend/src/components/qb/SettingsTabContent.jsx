/**
 * Settings Tab Content Component
 * مكون إعدادات الحسابات والأسعار
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AdjustmentsHorizontalIcon,
  CurrencyDollarIcon,
  CogIcon,
  HomeIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SettingsTabContent = ({
  calculationSettings,
  setCalculationSettings,
  finishingItems,
  electricalItems,
  plumbingItems
}) => {
  const [editingPrices, setEditingPrices] = useState(false);
  const [editablePrices, setEditablePrices] = useState({
    finishing: finishingItems,
    electrical: electricalItems,
    plumbing: plumbingItems
  });

  const updateSetting = (key, value) => {
    setCalculationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const togglePriceEditing = () => {
    if (editingPrices) {
      // حفظ التعديلات
      toast.success('تم حفظ إعدادات الأسعار بنجاح');
    } else {
      toast.info('يمكنك الآن تعديل الأسعار حسب السوق المحلي');
    }
    setEditingPrices(!editingPrices);
  };

  const updatePrice = (category, item, field, value) => {
    setEditablePrices(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: {
          ...prev[category][item],
          [field]: field === 'price' ? parseFloat(value) || 0 : {
            ...prev[category][item][field],
            ...value
          }
        }
      }
    }));
  };

  const resetPrices = () => {
    setEditablePrices({
      finishing: finishingItems,
      electrical: electricalItems,
      plumbing: plumbingItems
    });
    toast.info('تم إعادة تعيين الأسعار للقيم الافتراضية');
  };

  const currencies = [
    { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س' },
    { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ' },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$' },
    { code: 'EUR', name: 'يورو', symbol: '€' }
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
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4">
          <AdjustmentsHorizontalIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          إعدادات الحسابات والأسعار
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          قم بتخصيص إعدادات الحسابات والأسعار لتناسب السوق المحلي ومتطلبات مشروعك
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <CogIcon className="w-6 h-6 text-blue-600" />
            <h3 className="font-bold text-blue-900 text-lg">الإعدادات العامة</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Currency Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                العملة المستخدمة
              </label>
              <select
                value={calculationSettings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Profit Margin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                هامش الربح (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={calculationSettings.profitMargin}
                  onChange={(e) => updateSetting('profitMargin', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="absolute left-3 top-3 text-gray-500">%</span>
              </div>
            </div>
          </div>

          {/* VAT Rate */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ضريبة القيمة المضافة (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={calculationSettings.vatRate}
                  onChange={(e) => updateSetting('vatRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="absolute left-3 top-3 text-gray-500">%</span>
              </div>
            </div>
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              البنود المشمولة في الحساب
            </label>
            <div className="grid md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-reverse space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calculationSettings.includeFinishing}
                  onChange={(e) => updateSetting('includeFinishing', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <HomeIcon className="w-5 h-5 text-orange-600" />
                  <span className="text-gray-700">التشطيبات</span>
                </div>
              </label>

              <label className="flex items-center space-x-reverse space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calculationSettings.includeElectrical}
                  onChange={(e) => updateSetting('includeElectrical', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <BoltIcon className="w-5 h-5 text-yellow-600" />
                  <span className="text-gray-700">الكهرباء</span>
                </div>
              </label>

              <label className="flex items-center space-x-reverse space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calculationSettings.includePlumbing}
                  onChange={(e) => updateSetting('includePlumbing', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <WrenchScrewdriverIcon className="w-5 h-5 text-teal-600" />
                  <span className="text-gray-700">السباكة</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Price Management */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              <h3 className="font-bold text-green-900 text-lg">إدارة الأسعار</h3>
            </div>
            <div className="flex gap-3">
              {editingPrices && (
                <button
                  onClick={resetPrices}
                  className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  إعادة تعيين
                </button>
              )}
              <button
                onClick={togglePriceEditing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  editingPrices
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {editingPrices ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    حفظ التعديلات
                  </>
                ) : (
                  <>
                    <PencilIcon className="w-4 h-4" />
                    تعديل الأسعار
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">نصائح تحديث الأسعار</h4>
                <p className="text-blue-700 text-sm">
                  قم بتحديث الأسعار بناءً على السوق المحلي والموردين في منطقتك. 
                  تأكد من مراجعة الأسعار بانتظام لضمان دقة التقديرات.
                </p>
              </div>
            </div>
          </div>

          {/* Price Categories */}
          <div className="space-y-8">
            {/* Finishing Prices */}
            <PriceCategorySection
              title="أسعار التشطيبات"
              icon={HomeIcon}
              color="orange"
              items={editablePrices.finishing}
              isEditing={editingPrices}
              onUpdatePrice={(item, field, value) => updatePrice('finishing', item, field, value)}
            />

            {/* Electrical Prices */}
            <PriceCategorySection
              title="أسعار الأعمال الكهربائية"
              icon={BoltIcon}
              color="yellow"
              items={editablePrices.electrical}
              isEditing={editingPrices}
              onUpdatePrice={(item, field, value) => updatePrice('electrical', item, field, value)}
            />

            {/* Plumbing Prices */}
            <PriceCategorySection
              title="أسعار أعمال السباكة"
              icon={WrenchScrewdriverIcon}
              color="teal"
              items={editablePrices.plumbing}
              isEditing={editingPrices}
              onUpdatePrice={(item, field, value) => updatePrice('plumbing', item, field, value)}
            />
          </div>
        </div>
      </div>

      {/* Save Settings */}
      <div className="text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toast.success('تم حفظ جميع الإعدادات بنجاح!')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          <CheckCircleIcon className="w-6 h-6 inline ml-2" />
          حفظ جميع الإعدادات
        </motion.button>
      </div>
    </motion.div>
  );
};

// مكون قسم فئة الأسعار
const PriceCategorySection = ({ title, icon: Icon, color, items, isEditing, onUpdatePrice }) => {
  return (
    <div className={`border border-${color}-200 rounded-xl overflow-hidden`}>
      <div className={`px-4 py-3 bg-${color}-50 border-b border-${color}-200`}>
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 text-${color}-600`} />
          <h4 className={`font-semibold text-${color}-900`}>{title}</h4>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid gap-4">
          {Object.entries(items).map(([key, item]) => (
            <div key={key} className="grid md:grid-cols-4 gap-4 items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">{item.name}</h5>
                <p className="text-sm text-gray-500">{item.units}</p>
              </div>
              
              {item.prices ? (
                // للبنود التي لها أسعار متعددة (مثل التشطيبات)
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(item.prices).map(([priceKey, price]) => (
                    <div key={priceKey} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 capitalize">
                        {priceKey.replace('_', ' ')}:
                      </span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => onUpdatePrice(key, 'prices', { [priceKey]: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          step="0.01"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{price}</span>
                      )}
                      <span className="text-xs text-gray-500">ر.س</span>
                    </div>
                  ))}
                </div>
              ) : (
                // للبنود التي لها سعر واحد (مثل الكهرباء والسباكة)
                <div className="md:col-span-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600">السعر:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => onUpdatePrice(key, 'price', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="0.01"
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{item.price}</span>
                  )}
                  <span className="text-sm text-gray-500">ر.س / {item.units}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsTabContent;