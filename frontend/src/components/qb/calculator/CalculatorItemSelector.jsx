import React, { useState, useEffect } from "react";
import { FaRulerCombined, FaSearch, FaFilter } from "react-icons/fa";
import {
  itemDefinitions,
  getCategoryColor,
  getCategoryIcon,
  getCategoryName,
} from '../../utils/qb/calculatorConstants";

const CalculatorItemSelector = ({ darkMode, onAddItem }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredCategories, setFilteredCategories] = useState(itemDefinitions);

  // Filter logic
  useEffect(() => {
    if (searchTerm === "" && selectedCategory === "all") {
      setFilteredCategories(itemDefinitions);
      return;
    }

    const filtered = {};

    Object.entries(itemDefinitions).forEach(([category, items]) => {
      // Filter by category if one is selected
      if (selectedCategory !== "all" && category !== selectedCategory) {
        return;
      }

      // Filter items by search term
      const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Only include category if it has matching items
      if (filteredItems.length > 0) {
        filtered[category] = filteredItems;
      }
    });

    setFilteredCategories(filtered);
  }, [searchTerm, selectedCategory]);

  return (
    <div
      id="items"
      className={`rounded-2xl p-8 mb-8 border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${
        darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 border-gray-200"
      }`}
    >
      <div className="flex items-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-lg opacity-75"></div>
          <div className="relative bg-gradient-to-r from-green-600 to-blue-700 p-3 rounded-full">
            <FaRulerCombined className="text-white text-xl" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mr-4">إضافة بنود المشروع</h2>
      </div>

      {/* Filter and Search Tools */}
      <div className="mb-8">
        {/* Search Input */}
        <div className="relative group mb-6">
          <label
            className={`block text-sm font-medium mb-2 transition-colors group-hover:text-blue-400 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <span className="inline-flex items-center">
              <span className="mr-2">
                <FaSearch />
              </span>
              البحث عن بند
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-3 pl-12 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 group-hover:border-blue-400 ${
                darkMode
                  ? "bg-gray-700/50 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              placeholder="ابحث عن بند..."
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FaSearch />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute left-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-6">
          <label
            className={`block text-sm font-medium mb-3 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <span className="inline-flex items-center">
              <span className="mr-2">
                <FaFilter />
              </span>
              فلترة حسب الفئة
            </span>
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`relative overflow-hidden px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 ${
                selectedCategory === "all"
                  ? `${
                      darkMode
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent"
                    }`
                  : `${
                      darkMode
                        ? "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-blue-400"
                        : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
                    }`
              }`}
            >
              <span className="flex items-center">
                <span className="ml-2">📋</span>
                جميع الفئات
              </span>
            </button>

            {Object.entries(itemDefinitions).map(([category, items]) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`relative overflow-hidden px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 ${
                  selectedCategory === category
                    ? `${
                        darkMode
                          ? "bg-gradient-to-r " +
                            getCategoryColor(category) +
                            " text-white border-transparent"
                          : "bg-gradient-to-r " +
                            getCategoryColor(category) +
                            " text-white border-transparent"
                      }`
                    : `${
                        darkMode
                          ? "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-blue-400"
                          : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
                      }`
                }`}
              >
              <span className="flex items-center">
                <span className="ml-2">{getCategoryIcon(category)}</span>
                {getCategoryName(category)}
              </span>
            </button>
            ))}
          </div>
        </div>
      </div>

      {/* Display Filtered Items */}
      <div className="space-y-6">
        {Object.entries(filteredCategories).length === 0 ? (
          <div
            className={`text-center py-12 rounded-xl ${
              darkMode ? "bg-gray-700/30" : "bg-gray-100"
            }`}
          >
            <div className="text-5xl mb-4">🔍</div>
            <h3
              className={`text-xl font-bold mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              لا توجد نتائج
            </h3>
            <p className={`${darkMode ? "text-gray-500" : "text-gray-600"}`}>
              لم يتم العثور على أي بنود تطابق معايير البحث
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className={`mt-4 px-6 py-2 rounded-lg font-medium transition-colors ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              إعادة تعيين الفلتر
            </button>
          </div>
        ) : (
          Object.entries(filteredCategories).map(([category, items]) => (
            <div key={category} className="group">
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="min-w-[200px]">
                  <div
                    className={`relative overflow-hidden rounded-xl p-4 text-center transition-all duration-300 group-hover:scale-105 ${
                      darkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${getCategoryColor(
                        category
                      )} opacity-20`}
                    ></div>
                    <div className="relative z-10">
                      <span className="text-3xl mb-2 block">
                        {getCategoryIcon(category)}
                      </span>
                      <h3
                        className={`font-bold ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {getCategoryName(category)}
                      </h3>
                      <span
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        ({items.length} بند)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 flex-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onAddItem(category, item)}
                      className={`relative overflow-hidden px-6 py-3 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg group ${
                        darkMode
                          ? "bg-gray-700/50 border-gray-600 hover:border-blue-400"
                          : "bg-white border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${getCategoryColor(
                          category
                        )} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                      ></div>
                      <span
                        className={`relative z-10 font-medium ${
                          darkMode
                            ? "text-gray-300 group-hover:text-white"
                            : "text-gray-700 group-hover:text-gray-900"
                        }`}
                      >
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CalculatorItemSelector;
