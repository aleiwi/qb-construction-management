import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaMoneyBillWave,
  FaChartPie,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaCalculator,
  FaBell,
  FaFileInvoiceDollar,
  FaCoins,
  FaBalanceScale
} from 'react-icons/fa';
import { formatNumber, safeDivide } from '../../utils/qb/utils/calculatorLogic';

const AdvancedCostMonitor = ({ 
  projectData, 
  items = [], 
  results = null,
  darkMode = false,
  onUpdateBudget 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);

  // Advanced cost calculations
  const costAnalysis = useMemo(() => {
    if (!results) return null;

    // Parse total costs
    const totalCost = typeof results.totalCost === 'string' 
      ? parseInt(results.totalCost.replace(/,/g, '')) || 0
      : parseInt(results.totalCost) || 0;
    
    const finalPrice = typeof results.finalPrice === 'string'
      ? parseInt(results.finalPrice.replace(/,/g, '')) || 0
      : parseInt(results.finalPrice) || 0;

    // Calculate budget breakdown
    const materialsCost = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    const laborCost = safeDivide(finalPrice - materialsCost, 1) * 0.3; // Estimated 30% labor
    const equipmentCost = safeDivide(finalPrice - materialsCost, 1) * 0.15; // Estimated 15% equipment
    const overheadCost = safeDivide(finalPrice - materialsCost, 1) * 0.1; // Estimated 10% overhead
    const profit = finalPrice - totalCost;

    // Calculate cost per square meter
    const totalArea = results.totalArea || 0;
    const costPerSqm = totalArea > 0 ? safeDivide(totalCost, totalArea) : 0;

    // Market comparison
    const marketRates = {
      concrete: 300,
      steel: 3000,
      block: 1.5
    };

    const concreteMarketDiff = projectData.concretePrice 
      ? ((projectData.concretePrice - marketRates.concrete) / marketRates.concrete * 100)
      : 0;
    const steelMarketDiff = projectData.steelPrice
      ? ((projectData.steelPrice - marketRates.steel) / marketRates.steel * 100)
      : 0;
    const blockMarketDiff = projectData.blockPrice
      ? ((projectData.blockPrice - marketRates.block) / marketRates.block * 100)
      : 0;

    // Budget alerts
    const budgetThreshold = finalPrice * 0.85; // Alert when 85% of budget is used
    const costAlertLevel = totalCost > budgetThreshold ? 'warning' : 'normal';
    const profitMargin = finalPrice > 0 ? safeDivide(profit, finalPrice) * 100 : 0;

    // Cost variance analysis
    const estimatedCostPerSqm = 1200; // Industry average
    const variance = costPerSqm - estimatedCostPerSqm;
    const variancePercentage = estimatedCostPerSqm > 0 ? safeDivide(variance, estimatedCostPerSqm) * 100 : 0;

    return {
      totalCost,
      finalPrice,
      materialsCost,
      laborCost,
      equipmentCost,
      overheadCost,
      profit,
      profitMargin,
      costPerSqm,
      totalArea,
      costAlertLevel,
      marketAnalysis: {
        concrete: concreteMarketDiff,
        steel: steelMarketDiff,
        block: blockMarketDiff,
        overall: safeDivide(concreteMarketDiff + steelMarketDiff + blockMarketDiff, 3)
      },
      varianceAnalysis: {
        variance,
        variancePercentage,
        isOverBudget: variance > 0,
        efficiency: variance < 0 ? 'excellent' : variance < 200 ? 'good' : 'needs-attention'
      }
    };
  }, [projectData, items, results]);

  const costBreakdown = useMemo(() => {
    if (!costAnalysis) return [];

    return [
      {
        category: 'المواد',
        amount: costAnalysis.materialsCost,
        percentage: costAnalysis.finalPrice > 0 ? (costAnalysis.materialsCost / costAnalysis.finalPrice * 100) : 0,
        icon: '🧱',
        color: 'blue'
      },
      {
        category: 'العمالة',
        amount: costAnalysis.laborCost,
        percentage: costAnalysis.finalPrice > 0 ? (costAnalysis.laborCost / costAnalysis.finalPrice * 100) : 0,
        icon: '👷',
        color: 'green'
      },
      {
        category: 'المعدات',
        amount: costAnalysis.equipmentCost,
        percentage: costAnalysis.finalPrice > 0 ? (costAnalysis.equipmentCost / costAnalysis.finalPrice * 100) : 0,
        icon: '🚜',
        color: 'yellow'
      },
      {
        category: 'المصاريف الإدارية',
        amount: costAnalysis.overheadCost,
        percentage: costAnalysis.finalPrice > 0 ? (costAnalysis.overheadCost / costAnalysis.finalPrice * 100) : 0,
        icon: '🏢',
        color: 'purple'
      },
      {
        category: 'الربح',
        amount: costAnalysis.profit,
        percentage: costAnalysis.finalPrice > 0 ? (costAnalysis.profit / costAnalysis.finalPrice * 100) : 0,
        icon: '💰',
        color: 'emerald'
      }
    ];
  }, [costAnalysis]);

  const getBudgetStatus = (alertLevel) => {
    switch (alertLevel) {
      case 'warning': return { text: 'تحذير', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: FaExclamationTriangle };
      case 'critical': return { text: 'حرج', color: 'text-red-600', bg: 'bg-red-100', icon: FaExclamationTriangle };
      default: return { text: 'طبيعي', color: 'text-green-600', bg: 'bg-green-100', icon: FaCheckCircle };
    }
  };

  const getVarianceStatus = (efficiency) => {
    switch (efficiency) {
      case 'excellent': return { text: 'ممتاز', color: 'text-green-600', trend: 'down' };
      case 'good': return { text: 'جيد', color: 'text-blue-600', trend: 'neutral' };
      case 'needs-attention': return { text: 'يحتاج مراجعة', color: 'text-red-600', trend: 'up' };
      default: return { text: 'غير محدد', color: 'text-gray-600', trend: 'neutral' };
    }
  };

  const getMarketStatus = (percentage) => {
    if (percentage > 10) return { text: 'مرتفع', color: 'text-red-600', bg: 'bg-red-100' };
    if (percentage > 5) return { text: 'أعلى قليلاً', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (percentage < -10) return { text: 'منخفض', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage < -5) return { text: 'أقل قليلاً', color: 'text-blue-600', bg: 'bg-blue-100' };
    return { text: 'معقول', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  if (!costAnalysis) {
    return (
      <div className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm ${
        darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="text-center">
          <FaCalculator className={`mx-auto text-4xl mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            قم بحساب التكاليف أولاً لمتابعة التحليل المالي المتقدم
          </p>
        </div>
      </div>
    );
  }

  const budgetStatus = getBudgetStatus(costAnalysis.costAlertLevel);
  const varianceStatus = getVarianceStatus(costAnalysis.varianceAnalysis.efficiency);
  const BudgetIcon = budgetStatus.icon;

  return (
    <div className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm transition-all duration-300 ${
      darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-gradient-to-r from-green-600 to-emerald-700 p-3 rounded-full">
              <FaMoneyBillWave className="text-white text-xl" />
            </div>
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            💰 مراقبة التكاليف المتقدمة
          </h2>
        </div>
        
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 space-x-reverse ${budgetStatus.bg} ${budgetStatus.color}`}>
            <BudgetIcon className="text-sm" />
            <span>{budgetStatus.text}</span>
          </div>
        </div>
      </div>

      {/* Cost Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>إجمالي التكلفة</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {formatNumber(costAnalysis.totalCost, 0)}
              </p>
            </div>
            <FaCalculator className={`text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            السعر النهائي: {formatNumber(costAnalysis.finalPrice, 0)} ريال
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>تكلفة المتر المربع</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {formatNumber(costAnalysis.costPerSqm, 0)}
              </p>
            </div>
            <FaChartPie className={`text-2xl ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            المساحة: {formatNumber(costAnalysis.totalArea, 0)} م²
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>هامش الربح</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {formatNumber(costAnalysis.profitMargin, 1)}%
              </p>
            </div>
            <FaArrowUp className={`text-2xl ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            الربح: {formatNumber(costAnalysis.profit, 0)} ريال
          </div>
        </div>

        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/50'} border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>كفاءة التكلفة</p>
              <p className={`text-lg font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {varianceStatus.text}
              </p>
            </div>
            {varianceStatus.trend === 'up' ? 
              <FaArrowUp className={`text-2xl ${darkMode ? 'text-red-400' : 'text-red-600'}`} /> :
              <FaArrowDown className={`text-2xl ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            }
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            الانحراف: {formatNumber(costAnalysis.varianceAnalysis.variance, 0)} ريال/م²
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            استخدام الميزانية
          </span>
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {costAnalysis.finalPrice > 0 ? formatNumber((costAnalysis.totalCost / costAnalysis.finalPrice) * 100, 1) : 0}%
          </span>
        </div>
        <div className={`w-full bg-gray-200 rounded-full h-4 ${darkMode ? 'bg-gray-700' : ''}`}>
          <div 
            className={`h-4 rounded-full transition-all duration-500 ${
              costAnalysis.costAlertLevel === 'warning' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
              costAnalysis.costAlertLevel === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600' :
              'bg-gradient-to-r from-green-500 to-emerald-500'
            }`}
            style={{ 
              width: `${Math.min(100, (costAnalysis.totalCost / costAnalysis.finalPrice) * 100)}%` 
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            المستخدم: {formatNumber(costAnalysis.totalCost, 0)} ريال
          </span>
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            الإجمالي: {formatNumber(costAnalysis.finalPrice, 0)} ريال
          </span>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart Style Breakdown */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <FaChartPie className="inline ml-2" />
            توزيع التكاليف
          </h3>
          <div className="space-y-4">
            {costBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {item.category}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatNumber(item.amount, 0)} ريال
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {formatNumber(item.percentage, 1)}%
                  </p>
                  <div className={`w-20 bg-gray-200 rounded-full h-2 mt-1 ${darkMode ? 'bg-gray-700' : ''}`}>
                    <div 
                      className={`h-2 rounded-full ${
                        item.color === 'blue' ? 'bg-blue-500' :
                        item.color === 'green' ? 'bg-green-500' :
                        item.color === 'yellow' ? 'bg-yellow-500' :
                        item.color === 'purple' ? 'bg-purple-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Analysis */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <FaBalanceScale className="inline ml-2" />
            تحليل السوق
          </h3>
          <div className="space-y-4">
            {[
              { name: 'الخرسانة', diff: costAnalysis.marketAnalysis.concrete, unit: 'ريال/م³' },
              { name: 'الحديد', diff: costAnalysis.marketAnalysis.steel, unit: 'ريال/طن' },
              { name: 'البلوك', diff: costAnalysis.marketAnalysis.block, unit: 'ريال/قطعة' }
            ].map((item, index) => {
              const status = getMarketStatus(item.diff);
              return (
                <div key={index} className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white/50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {item.name}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        انحراف السوق: {item.diff > 0 ? '+' : ''}{formatNumber(item.diff, 1)}%
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Overall Market Assessment */}
            <div className={`p-4 rounded-xl border ${
              costAnalysis.marketAnalysis.overall > 5 ? 'border-red-300 bg-red-50' :
              costAnalysis.marketAnalysis.overall < -5 ? 'border-green-300 bg-green-50' :
              'border-blue-300 bg-blue-50'
            } ${darkMode ? 'border-gray-600 bg-gray-700/50' : ''}`}>
              <div className="flex items-center space-x-2 space-x-reverse">
                <FaBell className={`text-lg ${
                  costAnalysis.marketAnalysis.overall > 5 ? 'text-red-600' :
                  costAnalysis.marketAnalysis.overall < -5 ? 'text-green-600' :
                  'text-blue-600'
                }`} />
                <p className={`font-medium ${
                  costAnalysis.marketAnalysis.overall > 5 ? 'text-red-800' :
                  costAnalysis.marketAnalysis.overall < -5 ? 'text-green-800' :
                  'text-blue-800'
                } ${darkMode ? 'text-white' : ''}`}>
                  التقييم العام للسوق
                </p>
              </div>
              <p className={`text-sm mt-2 ${
                costAnalysis.marketAnalysis.overall > 5 ? 'text-red-700' :
                costAnalysis.marketAnalysis.overall < -5 ? 'text-green-700' :
                'text-blue-700'
              } ${darkMode ? 'text-gray-300' : ''}`}>
                {costAnalysis.marketAnalysis.overall > 5 ? 
                  'الأسعار أعلى من متوسط السوق - قد تحتاج لمراجعة الموردين' :
                  costAnalysis.marketAnalysis.overall < -5 ?
                  'الأسعار أقل من متوسط السوق - ممتاز!' :
                  'الأسعار ضمن النطاق الطبيعي'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Optimization Suggestions */}
      <div className={`mt-8 p-6 rounded-xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
          <FaCoins className="ml-2" />
          نصائح تحسين التكاليف
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {costAnalysis.varianceAnalysis.variance > 200 && (
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                ⚠️ التكلفة أعلى من المتوسط
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                فكر في التفاوض مع الموردين أو تحسين التصميم
              </p>
            </div>
          )}
          
          {costAnalysis.profitMargin < 10 && (
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                💡 هامش الربح منخفض
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                قد تحتاج لزيادة الأسعار أو تقليل التكاليف
              </p>
            </div>
          )}
          
          {costAnalysis.marketAnalysis.overall > 10 && (
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-orange-400' : 'text-orange-800'}`}>
                📈 أسعار أعلى من السوق
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                ابحث عن موردين بديلين للحصول على أسعار أفضل
              </p>
            </div>
          )}
          
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
            <p className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
              ✅ نصائح عامة
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
              راقب التكاليف بانتظام وقارن مع الميزانية المخططة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCostMonitor;