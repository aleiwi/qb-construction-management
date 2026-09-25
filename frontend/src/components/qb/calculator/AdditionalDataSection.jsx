import React from "react";
import { FaLayerGroup, FaCoins } from "react-icons/fa";
import CalculatorInput from "./CalculatorInput";

const AdditionalDataSection = ({
  darkMode,
  additionalData,
  setAdditionalData,
}) => {
  const updateAdditionalData = (field, value) => {
    setAdditionalData({ ...additionalData, [field]: value });
  };

  return (
    <div
      id="additionalData"
      className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${
        darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 border-gray-200"
      }`}
    >
      <div className="flex items-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-75"></div>
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-700 p-3 rounded-full">
            <FaLayerGroup className="text-white text-xl" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mr-4">البيانات الإضافية</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* قسم الدفان */}
        <div
          className={`rounded-xl p-6 transition-all duration-300 ${
            darkMode ? "bg-gray-700/30" : "bg-gray-50"
          }`}
        >
          <div className="flex items-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-lg opacity-75"></div>
              <div className="relative bg-gradient-to-r from-yellow-600 to-orange-700 p-2 rounded-full">
                <span className="text-white text-lg">🏔️</span>
              </div>
            </div>
            <h3 className="text-xl font-bold mr-3">بيانات الدفان</h3>
          </div>

          <div className="space-y-4">
            {[
              {
                label: "كمية الدفان (م³)",
                value: additionalData.backfillQuantity,
                onChange: (e) =>
                  updateAdditionalData("backfillQuantity", e.target.value),
                placeholder: "كمية الدفان (م³)",
                icon: <FaLayerGroup />,
                inputMode: "decimal",
              },
              {
                label: "سعر الدفان (ريال/م³)",
                value: additionalData.backfillPrice,
                onChange: (e) =>
                  updateAdditionalData("backfillPrice", e.target.value),
                placeholder: "سعر الدفان (ريال/م³)",
                icon: <FaCoins />,
                inputMode: "decimal",
              },
            ].map((props, i) => (
              <CalculatorInput key={i} {...props} darkMode={darkMode} />
            ))}
          </div>
        </div>

        {/* قسم العزل */}
        <div
          className={`rounded-xl p-6 transition-all duration-300 ${
            darkMode ? "bg-gray-700/30" : "bg-gray-50"
          }`}
        >
          <div className="flex items-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-75"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-700 p-2 rounded-full">
                <span className="text-white text-lg">🛡️</span>
              </div>
            </div>
            <h3 className="text-xl font-bold mr-3">بيانات العزل</h3>
          </div>

          <div className="space-y-4">
            {[
              {
                label: "كمية العزل (م²)",
                value: additionalData.insulationQuantity,
                onChange: (e) =>
                  updateAdditionalData("insulationQuantity", e.target.value),
                placeholder: "كمية العزل (م²)",
                icon: <FaLayerGroup />,
                inputMode: "decimal",
              },
              {
                label: "سعر العزل (ريال/م²)",
                value: additionalData.insulationPrice,
                onChange: (e) =>
                  updateAdditionalData("insulationPrice", e.target.value),
                placeholder: "سعر العزل (ريال/م²)",
                icon: <FaCoins />,
                inputMode: "decimal",
              },
            ].map((props, i) => (
              <CalculatorInput key={i} {...props} darkMode={darkMode} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalDataSection;
