
import React from 'react';
import { motion } from 'framer-motion';
import { FaHome, FaProjectDiagram, FaChartPie, FaCog } from 'react-icons/fa';

const Sidebar = ({ activeTab, setActiveTab, isOpen }) => {
  const menuItems = [
    { id: 'overview', icon: FaHome, label: 'لوحة التحكم' },
    { id: 'projects', icon: FaProjectDiagram, label: 'المشاريع' },
    { id: 'reports', icon: FaChartPie, label: 'التقارير' },
    { id: 'settings', icon: FaCog, label: 'الإعدادات' },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      className="hidden md:flex flex-col h-screen fixed right-0 top-0 bg-white z-30 border-l border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.1)] text-gray-700 font-sans backdrop-blur-md"
    >
      <div className="p-6 flex items-center justify-between h-[90px]">
        <div className={`flex items-center gap-3 ${!isOpen && 'justify-center w-full'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-200">
            Q
          </div>
          {isOpen && <span className="font-bold text-2xl tracking-tight text-[#1F2937]">Quantum</span>}
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group relative
              ${activeTab === item.id 
                ? 'text-[#8B5CF6] font-bold bg-[#8B5CF6]/5' 
                : 'text-gray-500 hover:text-[#8B5CF6] hover:bg-gray-50'
              } ${!isOpen ? 'justify-center' : ''}`}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="active-pill"
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full bg-[#8B5CF6]"
              />
            )}
            <item.icon className={`text-xl transition-transform group-hover:scale-110 ${activeTab === item.id ? 'drop-shadow-md' : ''}`} />
            {isOpen && <span className="text-base">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-5">
        <div className={`bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] rounded-2xl p-5 text-white shadow-xl shadow-blue-200/50 ${!isOpen ? 'hidden' : 'block'}`}>
          <p className="text-xs font-medium text-white/80 mb-2">الحساب الحالي</p>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">Premium</span>
            <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm">نشط</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
