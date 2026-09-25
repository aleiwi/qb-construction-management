import React from "react";
import { FaTrash, FaRulerCombined } from "react-icons/fa";
import { handleNumericInput } from "./CalculatorInput";
import {
  getCategoryIcon,
  getCategoryColor,
  getCategoryName,
} from '../../utils/qb/calculatorConstants";

const CalculatorItemsTable = ({
  items,
  darkMode,
  updateItem,
  deleteItem,
  results,
}) => {
  if (items.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border backdrop-blur-sm mb-8 overflow-hidden transition-all duration-300 hover:shadow-2xl ${
        darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 border-gray-200"
      }`}
    >
      <div
        className={`p-6 border-b ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="flex items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-lg opacity-75"></div>
            <div className="relative bg-gradient-to-r from-green-600 to-blue-700 p-3 rounded-full">
              <FaRulerCombined className="text-white text-xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mr-4">
            بنود المشروع ({items.length} بند)
          </h2>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th
                className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r ${
                  darkMode
                    ? "bg-gray-700/50 text-gray-300 border-gray-600"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                البنود وتوصيفها
              </th>
              <th
                colSpan="3"
                className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r ${
                  darkMode
                    ? "bg-blue-900/30 text-blue-300 border-gray-600"
                    : "bg-blue-50 text-blue-600 border-gray-200"
                }`}
              >
                📝 المدخلات
              </th>
              <th
                colSpan="4"
                className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r ${
                  darkMode
                    ? "bg-green-900/30 text-green-300 border-gray-600"
                    : "bg-green-50 text-green-600 border-gray-200"
                }`}
              >
                📊 المخرجات
              </th>
              <th
                colSpan="4"
                className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider border-r ${
                  darkMode
                    ? "bg-purple-900/30 text-purple-300 border-gray-600"
                    : "bg-purple-50 text-purple-600 border-gray-200"
                }`}
              >
                📐 المسطحات والأسعار
              </th>
              <th
                className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider ${
                  darkMode ? "bg-gray-700/50 text-gray-300" : "bg-gray-50 text-gray-600"
                }`}
              >
                إجراءات
              </th>
            </tr>
            <tr>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-gray-700/30 text-gray-400 border-gray-600"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                البند
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-blue-900/20 text-blue-300 border-gray-600"
                    : "bg-blue-100 text-blue-600 border-gray-200"
                }`}
              >
                المسطح أو الطول
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-blue-900/20 text-blue-300 border-gray-600"
                    : "bg-blue-100 text-blue-600 border-gray-200"
                }`}
              >
                العرض
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-blue-900/20 text-blue-300 border-gray-600"
                    : "bg-blue-100 text-blue-600 border-gray-200"
                }`}
              >
                السماكة
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-green-900/20 text-green-300 border-gray-600"
                    : "bg-green-100 text-green-600 border-gray-200"
                }`}
              >
                كمية الخرسانة
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-green-900/20 text-green-300 border-gray-600"
                    : "bg-green-100 text-green-600 border-gray-200"
                }`}
              >
                كمية الحديد
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-green-900/20 text-green-300 border-gray-600"
                    : "bg-green-100 text-green-600 border-gray-200"
                }`}
              >
                كمية البلوك
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-green-900/20 text-green-300 border-gray-600"
                    : "bg-green-100 text-green-600 border-gray-200"
                }`}
              >
                إجمالي تكلفة البند
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-purple-900/20 text-purple-300 border-gray-600"
                    : "bg-purple-100 text-purple-600 border-gray-200"
                }`}
              >
                المسطح قبل التحويل
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-purple-900/20 text-purple-300 border-gray-600"
                    : "bg-purple-100 text-purple-600 border-gray-200"
                }`}
              >
                معامل التحويل
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-purple-900/20 text-purple-300 border-gray-600"
                    : "bg-purple-100 text-purple-600 border-gray-200"
                }`}
              >
                المسطح بعد التحويل
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium border-r ${
                  darkMode
                    ? "bg-purple-900/20 text-purple-300 border-gray-600"
                    : "bg-purple-100 text-purple-600 border-gray-200"
                }`}
              >
                اجمالي البند
              </th>
              <th
                className={`px-4 py-2 text-center text-xs font-medium ${
                  darkMode ? "bg-gray-700/30 text-gray-400" : "bg-gray-100 text-gray-600"
                }`}
              >
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className={`transition-colors duration-200 ${
                  darkMode ? "hover:bg-gray-700/30" : "hover:bg-gray-50"
                }`}
              >
                <td
                  className={`px-4 py-3 text-xs border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-2xl mb-2">
                      {getCategoryIcon(item.category)}
                    </span>
                    <span
                      className={`font-bold text-center ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 bg-gradient-to-r ${getCategoryColor(
                        item.category
                      )} text-white`}
                    >
                      {getCategoryName(item.category)}
                    </span>
                  </div>
                </td>
                <td
                  className={`px-2 py-3 text-xs border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.length}
                    onChange={(e) => updateItem(item.id, "length", e.target.value)}
                    onKeyPress={handleNumericInput}
                    className={`w-full px-3 py-2 rounded-lg border text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? "bg-gray-700/50 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="المسطح أو الطول"
                  />
                </td>
                <td
                  className={`px-2 py-3 text-xs border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.width}
                    onChange={(e) => updateItem(item.id, "width", e.target.value)}
                    onKeyPress={handleNumericInput}
                    className={`w-full px-3 py-2 rounded-lg border text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? "bg-gray-700/50 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="العرض"
                  />
                </td>
                <td
                  className={`px-2 py-3 text-xs border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.thickness}
                    onChange={(e) =>
                      updateItem(item.id, "thickness", e.target.value)
                    }
                    onKeyPress={handleNumericInput}
                    className={`w-full px-3 py-2 rounded-lg border text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? "bg-gray-700/50 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="السماكة"
                  />
                </td>
                <td
                  className={`px-2 py-3 text-xs font-bold text-center border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      darkMode
                        ? "bg-green-900/30 text-green-300"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {parseFloat(item.concreteQty || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    م³
                  </div>
                </td>
                <td
                  className={`px-2 py-3 text-xs font-bold text-center border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      darkMode
                        ? "bg-green-900/30 text-green-300"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {parseFloat(item.steelQty || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    })}{" "}
                    طن
                  </div>
                </td>
                <td
                  className={`px-2 py-3 text-xs font-bold text-center border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      darkMode
                        ? "bg-green-900/30 text-green-300"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {parseFloat(item.blockQty || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    قطعة
                  </div>
                </td>
                <td
                  className={`px-2 py-3 text-xs font-bold text-center border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      darkMode
                        ? "bg-green-900/30 text-green-300"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {parseFloat(item.totalCost || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ريال
                  </div>
                </td>
                <td
                  className={`px-2 py-3 text-xs border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  {item.name === "كل المصاعد" ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.preArea}
                      onChange={(e) =>
                        updateItem(item.id, "preArea", e.target.value)
                      }
                      onKeyPress={handleNumericInput}
                      className={`w-full px-3 py-2 rounded-lg border text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        darkMode
                          ? "bg-gray-700/50 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="المسطح أو الطول"
                    />
                  ) : (
                    <div
                      className={`px-3 py-2 rounded-lg text-center ${
                        darkMode
                          ? "bg-purple-900/30 text-purple-300"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {parseFloat(item.preArea || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      م²
                    </div>
                  )}
                </td>
                <td
                  className={`px-2 py-3 text-xs border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  {(() => {
                    const name = (item.name || "").trim();
                    const zeroConversionItems = [
                      "صبة النظافة",
                      "القواعد",
                      "صبة اللبشة 2",
                      "صبة اللبشة2",
                      "الميدا",
                      "الأرضية بين الميدات",
                      "الارضية بين الميدات",
                      "جدار القبو",
                      "مسطح الأعمدة",
                      "مسطح الاعمدة",
                      "الجدران",
                      "اللبشة",
                      "الأعمدة",
                      "الاعمدة",
                      "الطرنشات",
                      "أعمدة السور",
                      "اعمدة السور",
                    ];
                    if (zeroConversionItems.includes(name)) {
                      return (
                        <div
                          className={`px-3 py-2 rounded-lg text-center font-bold ${
                            darkMode
                              ? "bg-gray-700/50 text-gray-400"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          0 (ثابت)
                        </div>
                      );
                    } else {
                      return (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.conversionFactor}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "conversionFactor",
                              e.target.value
                            )
                          }
                          onKeyPress={handleNumericInput}
                          className={`w-full px-3 py-2 rounded-lg border text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                          placeholder="1"
                        />
                      );
                    }
                  })()}
                </td>
                <td
                  className={`px-2 py-3 text-xs font-bold text-center border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      darkMode
                        ? "bg-purple-900/30 text-purple-300"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {parseFloat(item.area || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    م²
                  </div>
                </td>
                <td
                  className={`px-2 py-3 text-xs font-bold text-center border-r ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      darkMode
                        ? "bg-yellow-900/20 text-yellow-300"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {(() => {
                      // اجمالي البند = السعر بعد إضافة نسبة الربح (سعر المتر) × المسطح بعد التحويل
                      // Total Item = Price per meter with profit × Area after conversion

                      // Get final price including all costs and profit
                      const finalPrice = parseFloat(results?.finalPrice || 0);
                      const totalArea = parseFloat(results?.totalArea || 1);

                      // السعر بعد إضافة نسبة الربح (سعر المتر)
                      // Price per meter with profit margin
                      const pricePerMeterWithProfit =
                        totalArea > 0 ? finalPrice / totalArea : 0;

                      // المسطح بعد التحويل (item.area)
                      // Area after conversion
                      const area = parseFloat(item.area) || 0;

                      // Calculate: اجمالي البند = سعر المتر × المسطح
                      return (
                        (pricePerMeterWithProfit * area).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) + " ريال"
                      );
                    })()}
                  </div>
                </td>
                <td
                  className={`px-4 py-3 text-xs font-medium text-center ${
                    darkMode ? "" : ""
                  }`}
                >
                  <button
                    onClick={() => deleteItem(item.id)}
                    className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                      darkMode
                        ? "bg-red-900/30 text-red-300 hover:bg-red-800/50"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                    title="حذف البند"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalculatorItemsTable;
