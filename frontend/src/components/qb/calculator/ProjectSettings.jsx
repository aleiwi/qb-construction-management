import React from "react";
import {
  FaBuilding,
  FaFileAlt,
  FaFlag,
  FaCalendarAlt,
  FaChevronDown,
  FaGem,
  FaFire,
  FaCrown,
  FaStar,
  FaChartBar,
  FaCoins,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import CalculatorInput from "./CalculatorInput";

const ProjectSettings = ({
  darkMode,
  projectData,
  setProjectData,
  additionalData,
  setAdditionalData,
  errors,
  setErrors,
  marketRates,
  handleProjectNameInput,
}) => {
  const updateAdditionalData = (field, value) => {
    setAdditionalData({ ...additionalData, [field]: value });
  };

  return (
    <div
      id="project"
      className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${
        darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 border-gray-200"
      }`}
    >
      <div className="flex items-center mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-75"></div>
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 p-3 rounded-full">
            <FaBuilding className="text-white text-xl" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mr-4">إعدادات المشروع</h2>
      </div>

      <div className="space-y-10">
        {/* --- معلومات المشروع --- */}
        <div>
          <h3
            className={`text-xl font-semibold mb-4 pb-2 border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            1. معلومات المشروع الأساسية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CalculatorInput
              label="اسم المشروع"
              value={projectData.name}
              onChange={handleProjectNameInput}
              placeholder="اسم المشروع"
              icon={<FaBuilding />}
              error={errors.name}
              inputMode="text"
              darkMode={darkMode}
            />

            <CalculatorInput
              label="وصف المشروع"
              value={projectData.description || ""}
              onChange={(e) =>
                setProjectData({ ...projectData, description: e.target.value })
              }
              placeholder="وصف المشروع (اختياري)"
              icon={<FaFileAlt />}
              inputMode="text"
              darkMode={darkMode}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <CalculatorInput
              label="موقع المشروع"
              value={additionalData.projectLocation || ""}
              onChange={(e) =>
                updateAdditionalData("projectLocation", e.target.value)
              }
              placeholder="موقع المشروع (المدينة، الحي)"
              icon={<FaFlag />}
              inputMode="text"
              darkMode={darkMode}
            />

            <div className="flex flex-col md:flex-row gap-6">
              {/* تاريخ البداية */}
              <div
                className={`flex-1 relative p-1 rounded-xl transition-all duration-200 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <label
                  className={`block text-xs font-bold mb-2 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  تاريخ البداية
                </label>
                <div
                  className={`flex items-center p-3 rounded-xl border transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/50 ${
                    darkMode
                      ? "bg-gray-700/50 border-gray-600 focus-within:border-blue-400"
                      : "bg-gray-50 border-gray-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md"
                  }`}
                >
                  <div
                    className={`ml-3 p-2 rounded-lg ${
                      darkMode
                        ? "bg-gray-600 text-blue-400"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <FaCalendarAlt />
                  </div>
                  <input
                    type="date"
                    value={additionalData.startDate || ""}
                    onChange={(e) =>
                      updateAdditionalData("startDate", e.target.value)
                    }
                    className={`w-full bg-transparent font-bold text-lg focus:outline-none ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  />
                </div>
              </div>

              {/* تاريخ التسليم */}
              <div
                className={`flex-1 relative p-1 rounded-xl transition-all duration-200 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <label
                  className={`block text-xs font-bold mb-2 ${
                    darkMode ? "text-emerald-400" : "text-emerald-600"
                  }`}
                >
                  تاريخ التسليم
                </label>
                <div
                  className={`flex items-center p-3 rounded-xl border transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/50 ${
                    darkMode
                      ? "bg-gray-700/50 border-gray-600 focus-within:border-emerald-400"
                      : "bg-gray-50 border-gray-200 focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-md"
                  }`}
                >
                  <div
                    className={`ml-3 p-2 rounded-lg ${
                      darkMode
                        ? "bg-gray-600 text-emerald-400"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    <FaCalendarAlt />
                  </div>
                  <input
                    type="date"
                    value={additionalData.deliveryDate || ""}
                    onChange={(e) =>
                      updateAdditionalData("deliveryDate", e.target.value)
                    }
                    className={`w-full bg-transparent font-bold text-lg focus:outline-none ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* نوع المشروع */}
            <div
              className={`relative p-6 rounded-xl border transition-all duration-200 ${
                darkMode
                  ? "border-gray-600 bg-gray-700/50"
                  : "border-gray-300 bg-white"
              }`}
            >
              <label
                className={`block text-sm font-medium mb-3 ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div
                    className={`p-2 rounded-lg ${
                      darkMode ? "bg-gray-600" : "bg-gray-100"
                    }`}
                  >
                    <FaBuilding />
                  </div>
                  <span>نوع المشروع</span>
                </div>
              </label>
              <div className="relative">
                <select
                  value={additionalData.projectType || "سكني"}
                  onChange={(e) =>
                    updateAdditionalData("projectType", e.target.value)
                  }
                  className={`w-full p-4 text-lg font-medium border border-gray-300 rounded-lg transition-all duration-200 appearance-none ${
                    darkMode
                      ? "bg-gray-600 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } focus:outline-none`}
                >
                  <option value="سكني">سكني</option>
                  <option value="تجاري">تجاري</option>
                  <option value="طبي">طبي</option>
                  <option value="تعليمي">تعليمي</option>
                  <option value="سياحي">سياحي</option>
                  <option value="أخرى">أخرى</option>
                </select>
                <FaChevronDown
                  className={`absolute left-4 top-5 pointer-events-none ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </div>
            </div>

            {/* حالة المشروع */}
            <div
              className={`relative p-6 rounded-xl border transition-all duration-200 ${
                darkMode
                  ? "border-gray-600 bg-gray-700/50"
                  : "border-gray-300 bg-white"
              }`}
            >
              <label
                className={`block text-sm font-medium mb-3 ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div
                    className={`p-2 rounded-lg ${
                      darkMode ? "bg-gray-600" : "bg-gray-100"
                    }`}
                  >
                    <FaFlag />
                  </div>
                  <span>حالة المشروع</span>
                </div>
              </label>
              <div className="relative">
                <select
                  value={additionalData.status || "قيد التنفيذ"}
                  onChange={(e) =>
                    updateAdditionalData("status", e.target.value)
                  }
                  className={`w-full p-4 text-lg font-medium border border-gray-300 rounded-lg transition-all duration-200 appearance-none ${
                    darkMode
                      ? "bg-gray-600 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } focus:outline-none`}
                >
                  <option value="قيد التنفيذ">قيد التنفيذ</option>
                  <option value="مكتمل">مكتمل</option>
                  <option value="تخطيط">تخطيط</option>
                  <option value="معلق">معلق</option>
                </select>
                <FaChevronDown
                  className={`absolute left-4 top-5 pointer-events-none ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- أسعار المواد المحسنة --- */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-xl font-semibold pb-2 border-b ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              💰 أسعار المواد (بالريال السعودي)
            </h3>
            <div
              className={`text-sm px-3 py-1 rounded-full ${
                darkMode
                  ? "bg-blue-900/30 text-blue-400"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              📊 مقارنة مع السوق
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                label: "سعر الخرسانة (للمتر المكعب)",
                value: projectData.concretePrice,
                onChange: (e) => {
                  setProjectData({
                    ...projectData,
                    concretePrice: e.target.value,
                  });
                  if (errors.concretePrice)
                    setErrors({ ...errors, concretePrice: null });
                },
                placeholder: "سعر الخرسانة (للمتر المكعب)",
                icon: <FaGem />,
                error: errors.concretePrice,
                inputMode: "decimal",
                marketData: marketRates.concrete,
                unit: "ريال/م³",
              },
              {
                label: "سعر الحديد (للطن)",
                value: projectData.steelPrice,
                onChange: (e) => {
                  setProjectData({
                    ...projectData,
                    steelPrice: e.target.value,
                  });
                  if (errors.steelPrice)
                    setErrors({ ...errors, steelPrice: null });
                },
                placeholder: "سعر الحديد (للطن)",
                icon: <FaFire />,
                error: errors.steelPrice,
                inputMode: "decimal",
                marketData: marketRates.steel,
                unit: "ريال/طن",
              },
              {
                label: "سعر البلوك (للقطعة)",
                value: projectData.blockPrice,
                onChange: (e) => {
                  setProjectData({
                    ...projectData,
                    blockPrice: e.target.value,
                  });
                  if (errors.blockPrice)
                    setErrors({ ...errors, blockPrice: null });
                },
                placeholder: "سعر البلوك (للقطعة)",
                icon: <FaCrown />,
                error: errors.blockPrice,
                inputMode: "decimal",
                marketData: marketRates.block,
                unit: "ريال/قطعة",
              },
            ].map((input, index) => (
              <div
                key={index}
                className={`relative p-6 rounded-xl border transition-all duration-200 ${
                  input.error
                    ? "border-red-500 bg-red-50 shadow-md"
                    : darkMode
                    ? "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                    : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-md"
                }`}
              >
                <label
                  className={`block text-sm font-medium mb-3 ${
                    darkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div
                      className={`p-2 rounded-lg ${
                        darkMode ? "bg-gray-600" : "bg-gray-100"
                      }`}
                    >
                      {input.icon}
                    </div>
                    <span>{input.label}</span>
                    {input.required && <span className="text-red-500">*</span>}
                  </div>
                </label>

                <input
                  type="number"
                  value={input.value}
                  onChange={input.onChange}
                  placeholder={input.placeholder}
                  inputMode={input.inputMode}
                  className={`w-full p-4 text-lg font-medium border border-gray-300 rounded-lg transition-all duration-200 ${
                    input.error
                      ? "border-red-500 bg-red-50 text-red-700"
                      : darkMode
                      ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } focus:outline-none`}
                />

                {/* مؤشر مقارنة السوق */}
                {input.value && input.marketData && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span
                        className={darkMode ? "text-gray-400" : "text-gray-600"}
                      >
                        السوق: {input.marketData.min}-{input.marketData.max}{" "}
                        {input.unit}
                      </span>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        Number(input.value) < input.marketData.min
                          ? "bg-green-100 text-green-700"
                          : Number(input.value) > input.marketData.max
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {Number(input.value) < input.marketData.min
                        ? "💚 ممتاز"
                        : Number(input.value) > input.marketData.max
                        ? "🔴 مرتفع"
                        : "🟡 معقول"}
                    </div>
                  </div>
                )}

                {input.error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1 space-x-reverse">
                    <FaExclamationTriangle className="text-xs" />
                    <span>{input.error}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* --- التكاليف والأرباح --- */}
        <div>
          <h3
            className={`text-xl font-semibold mb-4 pb-2 border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            3. التكاليف الإضافية والأرباح
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                label: "سعر المصنعيات (للمتر المربع)",
                value: projectData.factoryRate,
                onChange: (e) => {
                  setProjectData({
                    ...projectData,
                    factoryRate: e.target.value,
                  });
                  if (errors.factoryRate)
                    setErrors({ ...errors, factoryRate: null });
                },
                placeholder: "سعر المصنعيات (للمتر المربع)",
                icon: <FaStar />,
                error: errors.factoryRate,
                inputMode: "decimal",
              },
              {
                label: "المصاريف الإدارية (مبلغ ثابت)",
                value: projectData.overheadRate,
                onChange: (e) =>
                  setProjectData({
                    ...projectData,
                    overheadRate: e.target.value,
                  }),
                placeholder: "المصاريف الإدارية (مبلغ ثابت)",
                icon: <FaChartBar />,
                inputMode: "decimal",
              },
              {
                label: "نسبة الربح للمتر المربع (%)",
                value: projectData.profitRate,
                onChange: (e) => {
                  setProjectData({
                    ...projectData,
                    profitRate: e.target.value,
                  });
                  if (errors.profitRate)
                    setErrors({ ...errors, profitRate: null });
                },
                placeholder: "نسبة الربح للمتر المربع (%)",
                icon: <FaCoins />,
                error: errors.profitRate,
                inputMode: "decimal",
              },
            ].map((props, i) => (
              <CalculatorInput key={i} {...props} darkMode={darkMode} />
            ))}
          </div>
        </div>
      </div>

      <div
        className={`mt-8 p-4 rounded-xl ${
          darkMode ? "bg-gray-700/30" : "bg-blue-50"
        }`}
      >
        <div className="flex items-start">
          <FaInfoCircle
            className={`mt-1 ml-2 ${
              darkMode ? "text-blue-400" : "text-blue-600"
            }`}
          />
          <div
            className={`text-sm ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <p className="font-bold mb-1">ملاحظات:</p>
            <ul className="list-disc pr-5 space-y-1">
              <li>
                الحقول المشار إليها بعلامة{" "}
                <span className="text-red-500">*</span> إلزامية.
              </li>
              <li>اسم المشروع يجب أن يحتوي على أحرف وليس أرقامًا فقط.</li>
              <li>يجب إدخال قيم موجبة في جميع الحقول الرقمية.</li>
              <li>
                <span className="font-semibold">
                  نسبة الربح للمتر المربع (%):
                </span>{" "}
                نسبة الربح المضافة لكل متر مربع. الربح الإجمالي = (إجمالي
                التكاليف × النسبة) / 100، والربح لكل متر = (تكلفة المتر × النسبة)
                / 100
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;
