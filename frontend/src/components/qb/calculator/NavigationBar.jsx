import React from 'react';
import { FaPlus, FaSave, FaFolderOpen, FaBuilding, FaLayerGroup, FaRulerCombined, FaChartLine } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const NavigationBar = ({ 
  darkMode, 
  handleNewProject, 
  saveProject, 
  results, 
  activeSection, 
  setActiveSection 
}) => (
  <nav
    className={`sticky top-0 z-40 ${
      darkMode
        ? "bg-gray-800/90 backdrop-blur-md"
        : "bg-white/90 backdrop-blur-md"
    } shadow-lg py-2`}
  >
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={handleNewProject}
            className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 font-bold ${
              darkMode
                ? "bg-red-800/80 text-white hover:bg-red-700"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
            title="بدء مشروع جديد"
          >
            <FaPlus className="ml-2" />
            مشروع جديد
          </button>
          <button
            onClick={saveProject}
            className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 font-bold ${
              darkMode
                ? "bg-green-800/80 text-white hover:bg-green-700"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
            title="حفظ المشروع الحالي"
          >
            <FaSave className="ml-2" />
            حفظ
          </button>
          <button
            onClick={() => {
              // TODO: إضافة modal لاختيار مشروع
              toast.info("قريباً: تحميل المشاريع المحفوظة");
            }}
            className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 font-bold ${
              darkMode
                ? "bg-blue-800/80 text-white hover:bg-blue-700"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            title="تحميل مشروع محفوظ"
          >
            <FaFolderOpen className="ml-2" />
            تحميل
          </button>
        </div>
        <div className="flex justify-center space-x-8 space-x-reverse">
          {[
            { id: "project", label: "إعدادات المشروع", icon: <FaBuilding /> },
            {
              id: "additionalData",
              label: "بيانات إضافية",
              icon: <FaLayerGroup />,
            },
            { id: "items", label: "بنود المشروع", icon: <FaRulerCombined /> },
            ...(results
              ? [{ id: "results", label: "النتائج", icon: <FaChartLine /> }]
              : []),
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(item.id)
                  .scrollIntoView({ behavior: "smooth" });
                setActiveSection(item.id);
              }}
              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 ${
                activeSection === item.id
                  ? `${
                      darkMode
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    }`
                  : `${
                      darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
              }`}
            >
              <span className="ml-2">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  </nav>
);

export default NavigationBar;
