import React from 'react';
import {
  FaChartLine,
  FaGem,
  FaFire,
  FaCrown,
  FaCoins,
  FaStar,
  FaChartBar,
  FaChartPie,
  FaFilePdf,
  FaFileExcel,
} from "react-icons/fa";
import { formatNumber, safeDivide } from '../../utils/qb/calculatorLogic";

const CalculatorResults = ({
  results,
  items,
  projectData,
  darkMode,
  onPdf,
  onExcel,
}) => {
  if (!results) return null;

  return (
    <div id="results" className="space-y-8">
      {/* الكميات الإجمالية */}
      <div
        className={`rounded-2xl p-8 border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${
          darkMode
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="flex items-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 p-3 rounded-full">
              <FaChartLine className="text-white text-xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mr-4">
            إجمالي الكميات وتكاليفها
          </h2>
        </div>

        {(() => {
          const totalItemsCost = items.reduce((sum, item) => {
            const finalPrice = parseFloat(results.finalPrice) || 0;
            const totalArea = parseFloat(results.totalArea) || 1;
            const pricePerMeterWithProfit = totalArea > 0 ? finalPrice / totalArea : 0;
            const itemArea = parseFloat(item.area) || 0;
            return sum + pricePerMeterWithProfit * itemArea;
          }, 0);

          return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {[
                {
                  label: "الخرسانة",
                  value: parseFloat(results.concreteQty || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                  unit: "م³",
                  color: "from-blue-500 to-cyan-500",
                  icon: <FaGem />,
                },
                {
                  label: "الحديد",
                  value: parseFloat(results.steelQty || 0).toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3}),
                  unit: "طن",
                  color: "from-green-500 to-emerald-500",
                  icon: <FaFire />,
                },
                {
                  label: "البلوك",
                  value: parseFloat(results.blockQty || 0).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0}),
                  unit: "قطعة",
                  color: "from-yellow-500 to-orange-500",
                  icon: <FaCrown />,
                },
                {
                  label: "المواد",
                  value: parseFloat(results.totalCost || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                  unit: "ريال",
                  color: "from-red-500 to-rose-500",
                  icon: <FaCoins />,
                },
                {
                  label: "المسطح الإجمالي",
                  value: parseFloat(results.totalArea || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                  unit: "م²",
                  color: "from-purple-500 to-pink-500",
                  icon: <FaStar />,
                },
                {
                  label: "مجموع البنود",
                  value: totalItemsCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
                  unit: "ريال",
                  color: "from-indigo-500 to-blue-600",
                  icon: <FaChartBar />,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl p-3 md:p-5 text-center transition-all duration-300 hover:scale-105"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`}
                  ></div>
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${item.color} mb-2`}
                    >
                      <span className="text-white text-sm md:text-lg">
                        {item.icon}
                      </span>
                    </div>
                    <p
                      className={`text-xs md:text-sm font-semibold mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {item.label}
                    </p>
                    <p
                      className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent whitespace-nowrap`}
                    >
                      {item.value}
                    </p>
                    <p
                      className={`text-xs md:text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* تحليل التكاليف والمقارنات */}
      <div
        className={`rounded-2xl p-8 border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${
          darkMode
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="flex items-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-gradient-to-r from-cyan-600 to-blue-700 p-3 rounded-full">
              <FaChartPie className="text-white text-xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mr-4">
            📊 تحليل التكاليف والمقارنات
          </h2>
        </div>

        {(() => {
          const materialCost = parseFloat(results.totalCost) || 0;
          const contractorCost =
            parseFloat(results.contractorWorkCost) || 0;
          const overheadCost = parseFloat(results.overhead) || 0;
          const backfillCost = parseFloat(results.backfillCost) || 0;
          const insulationCost = parseFloat(results.insulationCost) || 0;
          const totalCostWithoutProfit =
            materialCost +
            contractorCost +
            overheadCost +
            backfillCost +
            insulationCost;
          const totalArea = parseFloat(results.totalArea) || 1;
          const costPerMeter = formatNumber(
            safeDivide(totalCostWithoutProfit, totalArea),
            2
          );
          const finalPrice = parseFloat(results.finalPrice) || 0;
          const pricePerMeterWithProfit = formatNumber(
            safeDivide(finalPrice, totalArea),
            2
          );
          const profitAmount = parseFloat(results.profit) || 0;

          // نسب التكاليف - استخدام safeDivide لتجنب NaN عند القسمة على صفر
          const materialPercent = formatNumber(
            safeDivide(materialCost, totalCostWithoutProfit) * 100,
            1
          );
          const contractorPercent = formatNumber(
            safeDivide(contractorCost, totalCostWithoutProfit) * 100,
            1
          );
          const overheadPercent = formatNumber(
            safeDivide(overheadCost, totalCostWithoutProfit) * 100,
            1
          );
          const backfillPercent = formatNumber(
            safeDivide(backfillCost, totalCostWithoutProfit) * 100,
            1
          );
          const insulationPercent = formatNumber(
            safeDivide(insulationCost, totalCostWithoutProfit) * 100,
            1
          );
          const profitPercent = formatNumber(
            safeDivide(profitAmount, totalCostWithoutProfit) * 100,
            1
          );

          return (
            <div className="space-y-8">
              {/* المقارنة بين تكلفة المتر قبل وبعد الربح */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div
                  className={`group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
                    darkMode
                      ? "bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-700"
                      : "bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200"
                  }`}
                >
                  <div className="relative z-10">
                    <p
                      className={`text-sm font-medium mb-2 ${
                        darkMode ? "text-cyan-400" : "text-cyan-600"
                      }`}
                    >
                      🏢 تكلفة المتر (بدون ربح)
                    </p>
                    <p
                      className={`text-4xl font-bold mb-1 bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent`}
                    >
                      {costPerMeter}
                    </p>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-cyan-300" : "text-cyan-700"
                      }`}
                    >
                      ريال/م²
                    </p>
                  </div>
                </div>

                <div
                  className={`group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
                    darkMode
                      ? "bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-700"
                      : "bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200"
                  }`}
                >
                  <div className="relative z-10">
                    <p
                      className={`text-sm font-medium mb-2 ${
                        darkMode ? "text-yellow-400" : "text-yellow-600"
                      }`}
                    >
                      💰 الربح لكل متر
                    </p>
                    {(() => {
                      // حساب الربح لكل متر = (تكلفة المتر × نسبة الربح) / 100
                      const profitRate =
                        parseFloat(projectData.profitRate) || 0;
                      const profitPerMeter = safeDivide(
                        parseFloat(costPerMeter) * profitRate,
                        100
                      );
                      return (
                        <>
                          <p
                            className={`text-4xl font-bold mb-1 bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent`}
                          >
                            {formatNumber(profitPerMeter, 2)}
                          </p>
                          <p
                            className={`text-xs ${
                              darkMode
                                ? "text-yellow-300"
                                : "text-yellow-700"
                            }`}
                          >
                            ريال/م² ({profitRate}%)
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div
                  className={`group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
                    darkMode
                      ? "bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700"
                      : "bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200"
                  }`}
                >
                  <div className="relative z-10">
                    <p
                      className={`text-sm font-medium mb-2 ${
                        darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    >
                      📈 السعر بعد إضافة نسبة الربح
                    </p>
                    {(() => {
                      // السعر بعد الربح = تكلفة المتر + (تكلفة المتر × نسبة الربح / 100)
                      const profitRate =
                        parseFloat(projectData.profitRate) || 0;
                      const costPerMeterValue =
                        parseFloat(costPerMeter) || 0;
                      const profitPerMeter = safeDivide(
                        costPerMeterValue * profitRate,
                        100
                      );
                      const priceWithProfit =
                        costPerMeterValue + profitPerMeter;
                      return (
                        <>
                          <p
                            className={`text-4xl font-bold mb-1 bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent`}
                          >
                            {formatNumber(priceWithProfit, 2)}
                          </p>
                          <p
                            className={`text-xs ${
                              darkMode
                                ? "text-purple-300"
                                : "text-purple-700"
                            }`}
                          >
                            ريال/م²
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* توزيع التكاليف */}
              <div>
                <h3
                  className={`text-lg font-bold mb-6 pb-3 border-b ${
                    darkMode
                      ? "border-gray-700 text-gray-300"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  📈 توزيع التكاليف (النسب المئوية)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      label: "المواد",
                      value: materialPercent,
                      amount: materialCost,
                      color: "from-gray-500 to-gray-600",
                      icon: "🏗️",
                    },
                    {
                      label: "المصنعيات",
                      value: contractorPercent,
                      amount: contractorCost,
                      color: "from-indigo-500 to-purple-600",
                      icon: "🔨",
                    },
                    {
                      label: "المصاريف الإدارية",
                      value: overheadPercent,
                      amount: overheadCost,
                      color: "from-green-500 to-emerald-600",
                      icon: "📋",
                    },
                    {
                      label: "الدفان",
                      value: backfillPercent,
                      amount: backfillCost,
                      color: "from-yellow-500 to-orange-600",
                      icon: "🏔️",
                    },
                    {
                      label: "العزل",
                      value: insulationPercent,
                      amount: insulationCost,
                      color: "from-purple-500 to-pink-600",
                      icon: "🛡️",
                    },
                    {
                      label: "الربح",
                      value: profitPercent,
                      amount: profitAmount,
                      color: "from-red-500 to-rose-600",
                      icon: "💎",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-105 ${
                        darkMode ? "bg-gray-700/30" : "bg-gray-50"
                      }`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                      ></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{item.icon}</span>
                            <p
                              className={`font-semibold text-sm ${
                                darkMode
                                  ? "text-gray-200"
                                  : "text-gray-800"
                              }`}
                            >
                              {item.label}
                            </p>
                          </div>
                          <span
                            className={`text-lg font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}
                          >
                            {item.value}%
                          </span>
                        </div>
                        <div
                          className={`w-full h-2 rounded-full overflow-hidden ${
                            darkMode ? "bg-gray-600" : "bg-gray-200"
                          }`}
                        >
                          <div
                            className={`h-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                            style={{ width: `${item.value}%` }}
                          ></div>
                        </div>
                        <p
                          className={`text-xs mt-2 ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {item.amount.toFixed(0)} ريال
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* الملخص */}
              <div
                className={`p-6 rounded-lg border-2 ${
                  darkMode
                    ? "border-blue-600 bg-blue-900/20"
                    : "border-blue-400 bg-blue-50"
                }`}
              >
                <p
                  className={`text-sm font-bold mb-3 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  📌 ملخص التكلفة
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p
                      className={`${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      إجمالي التكاليف (بدون ربح):
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        darkMode ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      {totalCostWithoutProfit.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})} ريال
                    </p>
                  </div>
                  <div>
                    <p
                      className={`${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      المساحة الإجمالية:
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        darkMode ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      {parseFloat(results.totalArea || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} م²
                    </p>
                  </div>
                  <div>
                    <p
                      className={`${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      مربح المشروع:
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        darkMode ? "text-green-300" : "text-green-700"
                      }`}
                    >
                      {(() => {
                        // حساب مجموع البنود (مجموع إجمالي البند لكل بند)
                        // مجموع البنود = مجموع (إجمالي البند) لكل بند
                        const finalPrice = parseFloat(results.finalPrice) || 0;
                        const totalArea = parseFloat(results.totalArea) || 1;
                        const pricePerMeterWithProfit = totalArea > 0 ? finalPrice / totalArea : 0;
                        
                        // حساب مجموع البنود من offerPrice إذا كان موجوداً، وإلا من finalPrice
                        const offerPrice = parseFloat(projectData.offerPrice) || 0;
                        const totalItemsCost = offerPrice > 0
                          ? items.reduce((sum, item) => {
                              const itemArea = parseFloat(item.area) || 0;
                              return sum + offerPrice * itemArea;
                            }, 0)
                          : items.reduce((sum, item) => {
                              const itemArea = parseFloat(item.area) || 0;
                              return sum + pricePerMeterWithProfit * itemArea;
                            }, 0);
                        
                        // مربح المشروع = مجموع البنود - إجمالي التكاليف (بدون ربح)
                        const projectProfit = totalItemsCost - totalCostWithoutProfit;
                        return Math.abs(projectProfit).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
                      })()}{" "}
                      ريال
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      {/* أزرار الإجراءات */}
      <div className="flex flex-wrap gap-6 justify-center">
        {[
          {
            icon: <FaFilePdf />,
            label: "تقرير PDF",
            color: "from-red-500 to-rose-600",
            onClick: onPdf,
          },
          {
            icon: <FaFileExcel />,
            label: "تقرير Excel",
            color: "from-green-600 to-emerald-700",
            onClick: onExcel,
          },
        ].map((button, index) => (
          <button
            key={index}
            onClick={button.onClick}
            className="group relative overflow-hidden px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-r ${button.color} rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300`}
            ></div>
            <div
              className={`relative bg-gradient-to-r ${button.color} text-white px-8 py-4 rounded-2xl flex items-center`}
            >
              <span className="ml-3">{button.icon}</span>
              {button.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
  );
};

export default CalculatorResults;
